import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

/// color design tokens
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          500: "#656565",
          700: "#3d3d3d",
        },
        primary: {
          100: "#d0d1d5",
          400: "#1f2a40",
          500: "#141b2d",
          900: "#d0d1d5",
        },
        orangeAccent: {
          100: "#f1dead",
          400: "#F5C444",
          700: "#FCA61C",
        },
        textColor: {
          400: "#E0E0E0",
        },
      }
    : {
        grey: {
          100: "#141414",
          500: "#656565",
          700: "#a3a3a3",
        },
        primary: {
          100: "#040509",
          400: "#f2f0f0",
          500: "#fbfbfb",
          900: "#d0d1d5",
        },
        orangeAccent: {
          100: "#c6c7e7",
          400: "#3e4396",
          700: "#3e4396",
        },
        textColor: {
          400: "#141414",
        },
      }),
});

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);

  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: {
              main: colors.orangeAccent[700],
              highlight: colors.orangeAccent[100],
            },
            secondary: {
              main: colors.orangeAccent[400],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }
        : {
            primary: {
              main: colors.orangeAccent[700],
              highlight: colors.orangeAccent[100],
            },
            secondary: {
              main: colors.orangeAccent[400],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }),
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 40,
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 32,
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 24,
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 20,
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 16,
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: 14,
      },
    },
    components: {
      MuiInputLabel: {
        styleOverrides: {
          root: {
            "&.Mui-focused": {
              color: colors.orangeAccent[700],
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.orangeAccent[700],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: colors.orangeAccent[700],
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === "dark" ? colors.primary[500] : colors.primary[400],
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            "&.MuiButton-textPrimary": {
              color: colors.orangeAccent[700],
            },
          },
          containedPrimary: {
            backgroundColor: colors.orangeAccent[700],
          },
          outlinedPrimary: {
            color: colors.orangeAccent[700],
            borderColor: colors.orangeAccent[700],
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            "&.MuiIconButton-colorSecondary": {
              color: colors.orangeAccent[700],
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: colors.primary[400],
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color: colors.orangeAccent[500],
            "&.Mui-checked": {
              color: colors.orangeAccent[400],
            },
            "&.Mui-checked + .MuiSwitch-track": {
              backgroundColor: colors.orangeAccent[400],
            },
          },
          track: {
            backgroundColor: colors.orangeAccent[500],
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: colors.orangeAccent[400],
          },
          thumb: {
            color: colors.orangeAccent[400],
          },
          track: {
            color: colors.orangeAccent[400],
          },
          rail: {
            color: colors.orangeAccent[400],
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: `${colors.orangeAccent[700]} !important`,
              color: "#e0e0e0 !important",
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: colors.grey[700],
          },
          bar: {
            backgroundColor: colors.orangeAccent[700],
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: colors.orangeAccent[400],
            Height: "3px",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: colors.textColor[400],
            "&.Mui-selected": {
              fontWeight: "600",
              color: colors.orangeAccent[400],
            },
            "&.Mui-focusVisible": {
              border: `1px solid ${colors.orangeAccent[400]}`,
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: colors.orangeAccent[400],
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: colors.orangeAccent[400],
            "&.Mui-checked": {
              color: colors.orangeAccent[400],
            },
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: colors.orangeAccent[700],
              color: colors.primary[900],
              "&:hover": {
                backgroundColor: colors.orangeAccent[700],
              },
            },
          },
        },
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  const storedMode = localStorage.getItem("theme") || "light";
  const [mode, setMode] = useState(storedMode);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const newMode = prev === "light" ? "dark" : "light";
          localStorage.setItem("theme", newMode);
          return newMode;
        });
      },
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
