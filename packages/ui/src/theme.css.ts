import { createTheme, createThemeContract, style } from "@vanilla-extract/css";
import { recipe } from "@vanilla-extract/recipes";

export const vars = createThemeContract({
  color: {
    background: null,
    surface: null,
    surfaceMuted: null,
    text: null,
    textMuted: null,
    border: null,
    accent: null,
    accentText: null,
    warning: null,
    danger: null
  },
  space: {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null
  },
  radius: {
    card: null,
    control: null,
    pill: null
  },
  shadow: {
    overlay: null
  },
  font: {
    body: null
  }
});

export const themeClass = createTheme(vars, {
  color: {
    background: "#f7f8f5",
    surface: "#ffffff",
    surfaceMuted: "#eef3ef",
    text: "#17211b",
    textMuted: "#5b665f",
    border: "#d7dfd8",
    accent: "#1b6f5a",
    accentText: "#ffffff",
    warning: "#9a5b12",
    danger: "#b42318"
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px"
  },
  radius: {
    card: "8px",
    control: "6px",
    pill: "999px"
  },
  shadow: {
    overlay: "0 18px 48px rgb(23 33 27 / 18%)"
  },
  font: {
    body: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
  }
});

export const tokens = vars;

export const buttonRecipe = recipe({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "36px",
    border: "1px solid transparent",
    borderRadius: vars.radius.control,
    padding: `${vars.space[2]} ${vars.space[4]}`,
    font: "inherit",
    fontWeight: 600,
    background: vars.color.accent,
    color: vars.color.accentText,
    cursor: "pointer",
    selectors: {
      "&:disabled": {
        cursor: "not-allowed",
        opacity: 0.56
      }
    }
  },
  variants: {
    tone: {
      primary: {},
      secondary: {
        background: vars.color.surface,
        color: vars.color.text,
        borderColor: vars.color.border
      }
    }
  },
  defaultVariants: {
    tone: "primary"
  }
});

export const controlRecipe = recipe({
  base: {
    width: "100%",
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.control,
    padding: `${vars.space[2]} ${vars.space[3]}`,
    font: "inherit",
    color: vars.color.text,
    background: vars.color.surface
  },
  variants: {
    multiline: {
      true: {
        minHeight: "96px",
        resize: "vertical"
      },
      false: {}
    }
  },
  defaultVariants: {
    multiline: false
  }
});

export const statusBadgeRecipe = recipe({
  base: {
    display: "inline-flex",
    width: "fit-content",
    alignItems: "center",
    borderRadius: vars.radius.pill,
    padding: `${vars.space[1]} ${vars.space[2]}`,
    fontSize: "0.875rem",
    fontWeight: 600,
    background: vars.color.surfaceMuted,
    color: vars.color.text
  },
  variants: {
    tone: {
      neutral: {},
      warning: {
        color: vars.color.warning
      },
      danger: {
        color: vars.color.danger
      }
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

export const panelRecipe = recipe({
  base: {
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.card,
    background: vars.color.surface,
    color: vars.color.text
  }
});

export const overlayClass = style({
  position: "fixed",
  inset: 0,
  background: "rgb(23 33 27 / 28%)"
});

export const dialogContentClass = style({
  position: "fixed",
  top: "50%",
  left: "50%",
  width: "min(560px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 32px)",
  overflow: "auto",
  transform: "translate(-50%, -50%)",
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.card,
  background: vars.color.surface,
  boxShadow: vars.shadow.overlay,
  color: vars.color.text,
  padding: vars.space[5]
});

export const drawerContentClass = style({
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "min(420px, 100vw)",
  overflow: "auto",
  borderLeft: `1px solid ${vars.color.border}`,
  background: vars.color.surface,
  boxShadow: vars.shadow.overlay,
  color: vars.color.text,
  padding: vars.space[5]
});

export const titleClass = style({
  margin: `0 0 ${vars.space[4]}`,
  fontSize: "1rem",
  fontWeight: 700
});
