import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

/// color design tokens
export const tokens = (mode) => ({
  ...(mode === "dark"
    ? {
        grey: {
          100: "#e0e0e0",
          200: "#c1c1c1",
          300: "#a3a3a3",
          400: "#848484",
          500: "#656565",
          600: "#515151",
          700: "#3d3d3d",
          800: "#282828",
          900: "#141414",
        },
        primary: {
          100: "#d0d1d5",
          200: "#a1a4ab",
          300: "#727681",
          400: "#1f2a40",
          500: "#141b2d",
          600: "#101624",
          700: "#0c101b",
          800: "#080b12",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#dbf5ee",
          200: "#b7ebde",
          300: "#94e2cd",
          400: "#70d8bd",
          500: "#4cceac",
          600: "#3da58a",
          700: "#2e7c67",
          800: "#1e5245",
          900: "#0f2922",
        },
        redAccent: {
          100: "#f8dcdb",
          200: "#f1b9b7",
          300: "#e99592",
          400: "#e2726e",
          500: "#db4f4a",
          600: "#af3f3b",
          700: "#832f2c",
          800: "#58201e",
          900: "#2c100f",
        },
        blueAccent: {
          100: "#e1e2fe",
          200: "#c3c6fd",
          300: "#a4a9fc",
          400: "#868dfb",
          500: "#6870fa",
          600: "#535ac8",
          700: "#3e4396",
          800: "#2a2d64",
          900: "#151632",
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
          200: "#282828",
          300: "#3d3d3d",
          400: "#515151",
          500: "#656565",
          600: "#848484",
          700: "#a3a3a3",
          800: "#c1c1c1",
          900: "#e0e0e0",
        },
        primary: {
          100: "#040509",
          200: "#080b12",
          300: "#0c101b",
          400: "#f2f0f0",
          500: "#fbfbfb",
          600: "#434957",
          700: "#727681",
          800: "#a1a4ab",
          900: "#d0d1d5",
        },
        greenAccent: {
          100: "#0f2922",
          200: "#1e5245",
          300: "#2e7c67",
          400: "#3da58a",
          500: "#4cceac",
          600: "#70d8bd",
          700: "#94e2cd",
          800: "#b7ebde",
          900: "#dbf5ee",
        },
        redAccent: {
          100: "#2c100f",
          200: "#58201e",
          300: "#832f2c",
          400: "#af3f3b",
          500: "#db4f4a",
          600: "#e2726e",
          700: "#e99592",
          800: "#f1b9b7",
          900: "#f8dcdb",
        },
        blueAccent: {
          100: "#151632",
          200: "#2a2d64",
          300: "#3e4396",
          400: "#535ac8",
          500: "#6870fa",
          600: "#868dfb",
          700: "#a4a9fc",
          800: "#c3c6fd",
          900: "#e1e2fe",
        },
        orangeAccent: {
          100: "#c6c7e7",
          400: "#3e4396",
          700: "#3e4396",
          // Old orange: 400 -> ffb744, 700 -> fca61c
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
              main: colors.greenAccent[500],
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
              main: colors.greenAccent[500],
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
