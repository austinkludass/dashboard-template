/* eslint-disable @typescript-eslint/no-explicit-any */
import * as admin from "firebase-admin";
import {onCall} from "firebase-functions/https";
import {onRequest} from "firebase-functions/https";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const xeroClientId = defineSecret("XERO_CLIENT_ID");
const xeroClientSecret = defineSecret("XERO_CLIENT_SECRET");

const db = admin.firestore();

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_URL = "https://api.xero.com/api.xro/2.0";
const XERO_PAYROLL_AU_URL = "https://api.xero.com/payroll.xro/1.0";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "accounting.transactions",
  "accounting.contacts.read",
  "accounting.settings.read",
  "payroll.employees",
  "payroll.employees.read",
  "payroll.timesheets",
  "payroll.payruns",
  "payroll.settings",
  "payroll.settings.read",
].join(" ");

const REDIRECT_URI =
  "https://australia-southeast1-wisemindsadmin.cloudfunctions.net/xeroCallback";

function toXeroDate(date: Date | dayjs.Dayjs): string {
  const ms = dayjs(date).valueOf();
  return `/Date(${ms})/`;
}

export const getXeroAuthUrl = onCall(
  {
    region: "australia-southeast1",
    secrets: [xeroClientId],
  },
  async (request) => {
    const {useSandbox} = request.data || {};

    const state = Math.random().toString(36).substring(2, 15);

    await db.collection("xeroAuth").doc("pendingState").set({
      state,
      useSandbox: useSandbox || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const params = new URLSearchParams({
      response_type: "code",
      client_id: xeroClientId.value(),
      redirect_uri: REDIRECT_URI,
      scope: XERO_SCOPES,
      state,
    });

    return {
      authUrl: `${XERO_AUTH_URL}?${params.toString()}`,
    };
  }
);

export const xeroCallback = onRequest(
  {
    region: "australia-southeast1",
    secrets: [xeroClientId, xeroClientSecret],
  },
  async (req, res) => {
    const {code, state, error} = req.query;

    if (error) {
      logger.error("XERO OAuth error:", error);
      res.redirect(
        `https://wisemindsadmin.web.app/settings?xero=error&message=${error}`
      );
      return;
    }

    if (!code || !state) {
      res.redirect(
        "https://wisemindsadmin.web.app/settings?xero=error&message=missing_params"
      );
      return;
    }

    try {
      const pendingDoc = await db.collection("xeroAuth")
        .doc("pendingState").get();
      const pendingData = pendingDoc.data();

      if (!pendingData || pendingData.state !== state) {
        res.redirect(
          "https://wisemindsadmin.web.app/settings?xero=error&message=invalid_state"
        );
        return;
      }

      const tokenResponse = await fetch(XERO_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + Buffer.from(
            `${xeroClientId.value()}:${xeroClientSecret.value()}`
          ).toString("base64"),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logger.error("Token exchange failed:", errorText);
        res.redirect(
          "https://wisemindsadmin.web.app/settings?xero=error&message=token_exchange_failed"
        );
        return;
      }

      const tokens = await tokenResponse.json();

      const connectionsResponse = await fetch(XERO_CONNECTIONS_URL, {
        headers: {
          "Authorization": `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const connections = await connectionsResponse.json();
      const tenant = connections[0];

      await db.collection("xeroAuth").doc("tokens").set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        tokenType: tokens.token_type,
        scope: tokens.scope,
        tenantId: tenant?.tenantId || null,
        tenantName: tenant?.tenantName || null,
        tenantType: tenant?.tenantType || null,
        useSandbox: pendingData.useSandbox || false,
        connectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("xeroAuth").doc("pendingState").delete();

      logger.info("XERO connected successfully",
        {tenantName: tenant?.tenantName});

      res.redirect("https://wisemindsadmin.web.app/settings?xero=success");
    } catch (err: any) {
      logger.error("XERO callback error:", err);
      res.redirect(
        `https://wisemindsadmin.web.app/settings?xero=error&message=${err.message}`
      );
    }
  }
);

async function refreshXeroToken(): Promise<string> {
  const tokenDoc = await db.collection("xeroAuth").doc("tokens").get();
  const tokenData = tokenDoc.data();

  if (!tokenData) {
    throw new Error("XERO not connected. Please connect to XERO first.");
  }

  if (tokenData.expiresAt > Date.now() + 300000) {
    return tokenData.accessToken;
  }

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(
        `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
      ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokenData.refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Token refresh failed:", errorText);

    await db.collection("xeroAuth").doc("tokens").update({
      connected: false,
      error: "Token refresh failed",
    });

    throw new Error("XERO token refresh failed. Please reconnect to XERO.");
  }

  const tokens = await response.json();

  await db.collection("xeroAuth").doc("tokens").update({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return tokens.access_token;
}

export const getXeroStatus = onCall(
  {
    region: "australia-southeast1",
  },
  async () => {
    const tokenDoc = await db.collection("xeroAuth").doc("tokens").get();

    if (!tokenDoc.exists) {
      return {
        connected: false,
        tenantName: null,
        useSandbox: false,
      };
    }

    const data = tokenDoc.data();
    return {
      connected: true,
      tenantName: data?.tenantName || "Unknown Organisation",
      tenantId: data?.tenantId,
      useSandbox: data?.useSandbox || false,
      connectedAt: data?.connectedAt?.toDate?.()?.toISOString() || null,
    };
  }
);

export const disconnectXero = onCall(
  {
    region: "australia-southeast1",
  },
  async () => {
    await db.collection("xeroAuth").doc("tokens").delete();
    await db.collection("xeroAuth").doc("pendingState").delete();

    logger.info("XERO disconnected");

    return {success: true};
  }
);

export const toggleXeroSandbox = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {useSandbox} = request.data;

    const tokenDoc = await db.collection("xeroAuth").doc("tokens").get();

    if (!tokenDoc.exists) {
      throw new Error("XERO not connected");
    }

    await db.collection("xeroAuth").doc("tokens").update({
      useSandbox: useSandbox,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, useSandbox};
  }
);

async function findXeroContact(
  accessToken: string,
  tenantId: string,
  email: string
): Promise<any | null> {
  logger.info("Finding Xero contact", {email, tenantId});
  const response = await fetch(
    `${XERO_API_URL}/Contacts`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Xero-tenant-id": tenantId,
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    logger.warn("Failed to fetch contacts:", await response.text());
    return null;
  }

  const data = await response.json();
  const lowerEmail = email.toLowerCase();

  return (
    data.Contacts?.find(
      (c: any) =>
        c.EmailAddress &&
        c.EmailAddress.toLowerCase() === lowerEmail
    ) || null
  );
}

export const exportInvoicesToXero = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 300,
    secrets: [xeroClientId, xeroClientSecret],
  },
  async (request) => {
    const {weekStart, invoiceIds} = request.data;

    if (!weekStart) {
      throw new Error("Missing required field: weekStart");
    }

    const tokenDoc = await db.collection("xeroAuth").doc("tokens").get();
    const tokenData = tokenDoc.data();

    if (!tokenData) {
      throw new Error("XERO not connected. Please connect to XERO first.");
    }

    let accessToken = tokenData.accessToken;
    if (tokenData.expiresAt <= Date.now() + 300000) {
      accessToken = await refreshXeroToken();
    }

    const tenantId = tokenData.tenantId;

    let invoicesSnap;
    if (invoiceIds && invoiceIds.length > 0) {
      const invoiceRefs = invoiceIds.map((id: string) =>
        db.collection("invoices").doc(weekStart).collection("items").doc(id)
      );
      const docs = await Promise.all(invoiceRefs.map((ref: any) => ref.get()));
      invoicesSnap = {
        empty: docs.every((d: any) => !d.exists),
        docs: docs.filter((d: any) => d.exists),
      };
    } else {
      invoicesSnap = await db
        .collection("invoices")
        .doc(weekStart)
        .collection("items")
        .get();
    }

    if (invoicesSnap.empty) {
      throw new Error("No invoices found to export");
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const invoiceDoc of invoicesSnap.docs) {
      const invoice = invoiceDoc.data();

      if (!invoiceIds && invoice.exportedToXero) {
        results.push({
          invoiceId: invoiceDoc.id,
          familyName: invoice.familyName,
          skipped: true,
          reason: "Already exported",
        });
        continue;
      }

      try {
        const contact = await findXeroContact(
          accessToken,
          tenantId,
          invoice.parentEmail
        );

        if (!contact) {
          const errorMsg = `Contact not found for email:
            ${invoice.parentEmail}`;
          errors.push({
            invoiceId: invoiceDoc.id,
            familyName: invoice.familyName,
            error: errorMsg,
          });

          await invoiceDoc.ref.update({
            xeroExportError: errorMsg,
            xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        const lineItems = invoice.lineItems.map((item: any) => ({
          Description: `${item.studentName} - ${item.subject}
           (${dayjs(item.date).format("DD/MM/YYYY")}) -
            ${item.duration}h with ${item.tutorName}`,
          Quantity: 1,
          UnitAmount: item.price,
          AccountCode: "200",
          TaxType: "OUTPUT",
        }));

        const xeroInvoice = {
          Type: "ACCREC",
          Contact: {ContactID: contact.ContactID},
          Date: dayjs(invoice.weekEnd).format("YYYY-MM-DD"),
          DueDate: dayjs(invoice.weekEnd).add(14, "day").format("YYYY-MM-DD"),
          LineAmountTypes: "Inclusive",
          LineItems: lineItems,
          Reference: `WM-${weekStart}`,
          Status: "AUTHORISED",
        };

        const createResponse = await fetch(`${XERO_API_URL}/Invoices`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Xero-tenant-id": tenantId,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({Invoices: [xeroInvoice]}),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          errors.push({
            invoiceId: invoiceDoc.id,
            familyName: invoice.familyName,
            error: errorText,
          });

          await invoiceDoc.ref.update({
            xeroExportError: errorText,
            xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        const createData = await createResponse.json();
        const createdInvoice = createData.Invoices?.[0];

        await invoiceDoc.ref.update({
          xeroInvoiceId: createdInvoice?.InvoiceID,
          xeroInvoiceNumber: createdInvoice?.InvoiceNumber,
          exportedToXero: true,
          exportedAt: admin.firestore.FieldValue.serverTimestamp(),
          xeroExportError: admin.firestore.FieldValue.delete(),
        });

        results.push({
          invoiceId: invoiceDoc.id,
          familyName: invoice.familyName,
          xeroInvoiceId: createdInvoice?.InvoiceID,
          xeroInvoiceNumber: createdInvoice?.InvoiceNumber,
        });
      } catch (err: any) {
        errors.push({
          invoiceId: invoiceDoc.id,
          familyName: invoice.familyName,
          error: err.message,
        });

        await invoiceDoc.ref.update({
          xeroExportError: err.message,
          xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await db.collection("xeroExportHistory").add({
      type: "invoices",
      weekStart,
      isRetry: !!invoiceIds,
      exportedAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: results.filter((r) => !r.skipped).length,
      errorCount: errors.length,
      results,
      errors,
    });

    if (errors.length === 0) {
      await db.collection("invoices").doc(weekStart).update({
        locked: true,
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        exportedToXero: true,
      });
    } else {
      await db.collection("invoices").doc(weekStart).update({
        exportedToXero: false,
        hasExportErrors: true,
        lastExportAttempt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Exported ${results.length} invoices to XERO`, {
      weekStart,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      exported: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      errors: errors.length,
      results,
      errorDetails: errors,
      allExported: errors.length === 0,
    };
  }
);

async function findXeroEmployee(
  accessToken: string,
  tenantId: string,
  email: string
): Promise<any | null> {
  const url = `${XERO_PAYROLL_AU_URL}/Employees`;

  logger.info("Fetching Xero employees", {url, tenantId});

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Xero-tenant-id": tenantId,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Failed to fetch employees", {
      status: response.status,
      statusText: response.statusText,
      errorBody: errorText,
      url,
      tenantId,
    });
    return null;
  }

  const data = await response.json();
  const employees = data.Employees || [];

  logger.info("Xero employees fetched", {
    count: employees.length,
    emails: employees.map((emp: any) => emp.Email),
  });

  const lowerEmail = email.toLowerCase();
  const found = employees.find((emp: any) =>
    emp.Email?.toLowerCase() === lowerEmail
  ) || null;

  if (!found) {
    logger.warn("Employee not found by email match", {
      searchEmail: email,
      availableEmails: employees.map((emp: any) => emp.Email),
    });
  }

  return found;
}

async function getEarningsRateId(
  accessToken: string,
  tenantId: string,
  employee: any
): Promise<string | null> {
  const templateEarningsRateId =
    employee.PayTemplate?.EarningsLines?.[0]?.EarningsRateID;

  if (templateEarningsRateId) {
    return templateEarningsRateId;
  }

  try {
    const response = await fetch(`${XERO_PAYROLL_AU_URL}/PayItems`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Xero-tenant-id": tenantId,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const ordinaryEarnings = data.PayItems?.EarningsRates?.find(
        (rate: any) => rate.EarningsType === "ORDINARYTIMEEARNINGS"
      );
      return ordinaryEarnings?.EarningsRateID || null;
    }
  } catch (err) {
    logger.warn("Failed to fetch PayItems for earnings rate", err);
  }

  return null;
}

export const exportPayrollToXero = onCall(
  {
    region: "australia-southeast1",
    timeoutSeconds: 300,
    secrets: [xeroClientId, xeroClientSecret],
  },
  async (request) => {
    const {weekStart, tutorIds} = request.data;

    if (!weekStart) {
      throw new Error("Missing required field: weekStart");
    }

    const tokenDoc = await db.collection("xeroAuth").doc("tokens").get();
    const tokenData = tokenDoc.data();

    if (!tokenData) {
      throw new Error("XERO not connected. Please connect to XERO first.");
    }

    let accessToken = tokenData.accessToken;
    if (tokenData.expiresAt <= Date.now() + 300000) {
      accessToken = await refreshXeroToken();
    }

    const tenantId = tokenData.tenantId;

    let payrollSnap;
    if (tutorIds && tutorIds.length > 0) {
      const payrollRefs = tutorIds.map((id: string) =>
        db.collection("payroll").doc(weekStart).collection("items").doc(id)
      );
      const docs = await Promise.all(payrollRefs.map((ref: any) => ref.get()));
      payrollSnap = {
        empty: docs.every((d: any) => !d.exists),
        docs: docs.filter((d: any) => d.exists),
      };
    } else {
      payrollSnap = await db
        .collection("payroll")
        .doc(weekStart)
        .collection("items")
        .get();
    }

    if (payrollSnap.empty) {
      throw new Error("No payroll data found to export");
    }

    const allTutorIds = payrollSnap.docs.map((d: any) => d.id);
    const tutorsSnap = await db
      .collection("tutors")
      .where(
        admin.firestore.FieldPath.documentId(),
        "in",
        allTutorIds.slice(0, 30)
      )
      .get();

    const tutorEmailMap = new Map<string, string>();
    tutorsSnap.docs.forEach((d) => {
      const data = d.data();
      tutorEmailMap.set(d.id, data.wiseMindsEmail || data.email);
    });

    const results: any[] = [];
    const errors: any[] = [];

    const weekStartDate = dayjs(weekStart);
    const weekEndDate = weekStartDate.add(6, "day");

    for (const payrollDoc of payrollSnap.docs) {
      const payroll = payrollDoc.data();
      const tutorEmail = tutorEmailMap.get(payrollDoc.id);

      if (!tutorIds && payroll.exportedToXero) {
        results.push({
          tutorId: payrollDoc.id,
          tutorName: payroll.tutorName,
          skipped: true,
          reason: "Already exported",
        });
        continue;
      }

      if (!tutorEmail) {
        const errorMsg = "Tutor email not found";
        errors.push({
          tutorId: payrollDoc.id,
          tutorName: payroll.tutorName,
          error: errorMsg,
        });

        await payrollDoc.ref.update({
          xeroExportError: errorMsg,
          xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        continue;
      }

      try {
        const employee = await findXeroEmployee(
          accessToken,
          tenantId,
          tutorEmail
        );

        if (!employee) {
          const errorMsg = `Employee not found in XERO for email:
            ${tutorEmail}`;
          errors.push({
            tutorId: payrollDoc.id,
            tutorName: payroll.tutorName,
            error: errorMsg,
          });

          await payrollDoc.ref.update({
            xeroExportError: errorMsg,
            xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        if (payroll.totalHours <= 0) {
          results.push({
            tutorId: payrollDoc.id,
            tutorName: payroll.tutorName,
            skipped: true,
            reason: "No hours to export",
          });
          continue;
        }

        const earningsRateId = await getEarningsRateId(
          accessToken,
          tenantId,
          employee
        );

        if (!earningsRateId) {
          const errorMsg = "No earnings rate found for employee";
          errors.push({
            tutorId: payrollDoc.id,
            tutorName: payroll.tutorName,
            error: errorMsg,
          });

          await payrollDoc.ref.update({
            xeroExportError: errorMsg,
            xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        const dailyUnits = [0, 0, 0, 0, 0, 0, 0];

        if (payroll.lessons && Array.isArray(payroll.lessons)) {
          for (const lesson of payroll.lessons) {
            const lessonDate = dayjs(lesson.date || lesson.startDateTime);
            const dayIndex = lessonDate.diff(weekStartDate, "day");
            if (dayIndex >= 0 && dayIndex < 7) {
              dailyUnits[dayIndex] += lesson.duration || lesson.hours || 0;
            }
          }
        }

        const additionalHours = payroll.additionalHours || 0;
        if (additionalHours > 0) {
          dailyUnits[6] += additionalHours;
        }

        const totalDistributed = dailyUnits.reduce((sum, h) => sum + h, 0);
        if (totalDistributed === 0 && payroll.totalHours > 0) {
          dailyUnits[0] = payroll.totalHours;
        }

        const timesheet = {
          EmployeeID: employee.EmployeeID,
          StartDate: toXeroDate(weekStartDate),
          EndDate: toXeroDate(weekEndDate),
          Status: "Draft",
          TimesheetLines: [
            {
              EarningsRateID: earningsRateId,
              NumberOfUnits: dailyUnits,
            },
          ],
        };

        logger.info("Creating timesheet", {
          employeeId: employee.EmployeeID,
          tutorName: payroll.tutorName,
          totalHours: payroll.totalHours,
          dailyUnits,
        });

        const createResponse = await fetch(
          `${XERO_PAYROLL_AU_URL}/Timesheets`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Xero-tenant-id": tenantId,
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify([timesheet]),
          }
        );

        const responseText = await createResponse.text();

        if (!createResponse.ok) {
          logger.error("Failed to create timesheet", {
            status: createResponse.status,
            response: responseText,
          });

          let errorMsg = responseText;
          try {
            const errorData = JSON.parse(responseText);
            errorMsg = errorData.Message || responseText;
          } catch {
            // ignore JSON parse errors
          }

          errors.push({
            tutorId: payrollDoc.id,
            tutorName: payroll.tutorName,
            error: errorMsg,
          });

          await payrollDoc.ref.update({
            xeroExportError: errorMsg,
            xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          continue;
        }

        let createdTimesheet: any = null;
        try {
          const createData = JSON.parse(responseText);
          createdTimesheet = createData.Timesheets?.[0];
        } catch {
          logger.warn("Could not parse timesheet response", {responseText});
        }

        await payrollDoc.ref.update({
          xeroTimesheetId: createdTimesheet?.TimesheetID || null,
          exportedToXero: true,
          exportedAt: admin.firestore.FieldValue.serverTimestamp(),
          xeroExportError: admin.firestore.FieldValue.delete(),
        });

        results.push({
          tutorId: payrollDoc.id,
          tutorName: payroll.tutorName,
          xeroTimesheetId: createdTimesheet?.TimesheetID,
          hours: payroll.totalHours,
        });
      } catch (err: any) {
        logger.error("Error processing payroll", {
          tutorId: payrollDoc.id,
          error: err.message,
        });
        errors.push({
          tutorId: payrollDoc.id,
          tutorName: payroll.tutorName,
          error: err.message,
        });
        await payrollDoc.ref.update({
          xeroExportError: err.message,
          xeroExportAttemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await db.collection("xeroExportHistory").add({
      type: "payroll",
      weekStart,
      isRetry: !!tutorIds,
      exportedAt: admin.firestore.FieldValue.serverTimestamp(),
      successCount: results.filter((r) => !r.skipped).length,
      errorCount: errors.length,
      results,
      errors,
    });

    if (errors.length === 0) {
      await db.collection("payroll").doc(weekStart).update({
        locked: true,
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        exportedToXero: true,
      });
    } else {
      await db.collection("payroll").doc(weekStart).update({
        exportedToXero: false,
        hasExportErrors: true,
        lastExportAttempt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Exported ${results.length} timesheets to XERO`, {
      weekStart,
      errors: errors.length,
    });

    return {
      success: errors.length === 0,
      exported: results.filter((r) => !r.skipped).length,
      skipped: results.filter((r) => r.skipped).length,
      errors: errors.length,
      results,
      errorDetails: errors,
      allExported: errors.length === 0,
    };
  }
);

export const getXeroExportHistory = onCall(
  {
    region: "australia-southeast1",
  },
  async (request) => {
    const {type, limit = 20} = request.data || {};

    let query = db.collection("xeroExportHistory")
      .orderBy("exportedAt", "desc")
      .limit(limit);

    if (type) {
      query = query.where("type", "==", type);
    }

    const snapshot = await query.get();

    return {
      history: snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        exportedAt: d.data().exportedAt?.toDate?.()?.toISOString() || null,
      })),
    };
  }
);
