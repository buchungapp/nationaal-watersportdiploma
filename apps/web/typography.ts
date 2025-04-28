export default function typographyStyles() {
  return {
    DEFAULT: {
      css: {
        "--tw-prose-body": "var(--color-slate-600)",
        "--tw-prose-headings": "var(--color-slate-900)",
        "--tw-prose-links": "var(--color-branding-light)",
        "--tw-prose-links-hover": "var(--color-branding-dark)",
        "--tw-prose-underline":
          "rgba(from var(--color-branding-light) r g b / 0.2)",
        "--tw-prose-underline-hover": "var(--color-branding-light)",
        "--tw-prose-bold": "var(--color-slate-900)",
        "--tw-prose-counters": "var(--color-slate-900)",
        "--tw-prose-bullets": "var(--color-slate-900)",
        "--tw-prose-hr": "var(--color-slate-100)",
        "--tw-prose-quote-borders": "var(--color-slate-200)",
        "--tw-prose-captions": "var(--color-slate-400)",
        "--tw-prose-code": "var(--color-slate-700)",
        "--tw-prose-code-bg": "rgba(from var(--color-slate-300) r g b / 0.2)",
        "--tw-prose-pre-code": "var(--color-slate-100)",
        "--tw-prose-pre-bg": "var(--color-slate-900)",
        "--tw-prose-pre-border": "transparent",
        "--tw-prose-th-borders": "var(--color-slate-200)",
        "--tw-prose-td-borders": "var(--color-slate-100)",

        "--tw-prose-invert-body": "var(--color-slate-400)",
        "--tw-prose-invert-headings": "var(--color-slate-200)",
        "--tw-prose-invert-links": "var(--color-branding-light)",
        "--tw-prose-invert-links-hover": "var(--color-branding-light)",
        "--tw-prose-invert-underline":
          "rgba(from var(--color-branding-light) r g b / 0.3)",
        "--tw-prose-invert-underline-hover": "var(--color-branding-light)",
        "--tw-prose-invert-bold": "var(--color-slate-200)",
        "--tw-prose-invert-counters": "var(--color-slate-200)",
        "--tw-prose-invert-bullets": "var(--color-slate-200)",
        "--tw-prose-invert-hr": "rgba(from var(--color-slate-700) r g b / 0.4)",
        "--tw-prose-invert-quote-borders": "var(--color-slate-500)",
        "--tw-prose-invert-captions": "var(--color-slate-500)",
        "--tw-prose-invert-code": "var(--color-slate-300)",
        "--tw-prose-invert-code-bg":
          "rgba(from var(--color-slate-200) r g b / 0.05)",
        "--tw-prose-invert-pre-code": "var(--color-slate-100)",
        "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 0.4)",
        "--tw-prose-invert-pre-border":
          "rgba(from var(--color-slate-200) r g b / 0.1)",
        "--tw-prose-invert-th-borders": "var(--color-slate-700)",
        "--tw-prose-invert-td-borders": "var(--color-slate-800)",

        // Base
        color: "var(--tw-prose-body)",
        lineHeight: "1.75rem",
        "> *": {
          marginTop: "--spacing(10)",
          marginBottom: "--spacing(10)",
        },
        p: {
          marginTop: "--spacing(7)",
          marginBottom: "--spacing(7)",
          textAlign: "justify",
        },

        // Headings
        "h2, h3": {
          color: "var(--tw-prose-headings)",
          fontWeight: "var(--font-weight-semibold)",
        },
        h2: {
          fontSize: "var(--text-xl)",
          lineHeight: "1.75rem",
          marginTop: "--spacing(12)",
          marginBottom: "--spacing(4)",
        },
        h3: {
          fontSize: "var(--text-base)",
          lineHeight: "1.75rem",
          marginTop: "--spacing(8)",
          marginBottom: "--spacing(4)",
        },
        ":is(h2, h3) + *": {
          marginTop: 0,
        },

        // Images
        img: {
          borderRadius: "var(--radius-3xl)",
        },

        // Inline elements
        a: {
          color: "var(--tw-prose-links)",
          fontWeight: "var(--font-weight-semibold)",
          textDecoration: "underline",
          textDecorationColor: "var(--tw-prose-underline)",
          transitionProperty: "color, text-decoration-color",
          transitionDuration: "150ms",
          transitionTimingFunction: "var(--ease-in-out)",
        },
        "a:hover": {
          color: "var(--tw-prose-links-hover)",
          textDecorationColor: "var(--tw-prose-underline-hover)",
        },
        strong: {
          color: "var(--tw-prose-bold)",
          fontWeight: "var(--font-weight-semibold)",
        },
        code: {
          display: "inline-block",
          color: "var(--tw-prose-code)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
          backgroundColor: "var(--tw-prose-code-bg)",
          borderRadius: "var(--radius-lg)",
          paddingLeft: "--spacing(1)",
          paddingRight: "--spacing(1)",
        },
        "a code": {
          color: "inherit",
        },
        ":is(h2, h3) code": {
          fontWeight: "var(--font-weight-bold)",
        },

        // Quotes
        blockquote: {
          paddingLeft: "--spacing(6)",
          borderLeftWidth: "--spacing(2)",
          borderLeftColor: "var(--tw-prose-quote-borders)",
          fontStyle: "italic",
        },

        // Figures
        figcaption: {
          color: "var(--tw-prose-captions)",
          fontSize: "var(--text-sm)",
          lineHeight: "var(--leading-normal)",
          marginTop: "--spacing(3)",
        },
        "figcaption > p": {
          margin: 0,
        },

        // Lists
        ul: {
          listStyleType: "disc",
        },
        ol: {
          listStyleType: "decimal",
        },
        "ul, ol": {
          paddingLeft: "--spacing(6)",
        },
        li: {
          marginTop: "--spacing(6)",
          marginBottom: "--spacing(6)",
          paddingLeft: "--spacing(3.5)",
        },
        "li::marker": {
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-semibold)",
        },
        "ol > li::marker": {
          color: "var(--tw-prose-counters)",
        },
        "ul > li::marker": {
          color: "var(--tw-prose-bullets)",
        },
        "li :is(ol, ul)": {
          marginTop: "--spacing(4)",
          marginBottom: "--spacing(4)",
        },
        "li :is(li, p)": {
          marginTop: "--spacing(3)",
          marginBottom: "--spacing(3)",
        },

        // Code blocks
        pre: {
          color: "var(--tw-prose-pre-code)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--font-weight-medium)",
          backgroundColor: "var(--tw-prose-pre-bg)",
          borderRadius: "var(--radius-3xl)",
          padding: "--spacing(8)",
          overflowX: "auto",
          border: "1px solid",
          borderColor: "var(--tw-prose-pre-border)",
        },
        "pre code": {
          display: "inline",
          color: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          backgroundColor: "transparent",
          borderRadius: 0,
          padding: 0,
        },

        // Horizontal rules
        hr: {
          marginTop: "--spacing(12)",
          marginBottom: "--spacing(12)",
          borderTopWidth: "1px",
          borderColor: "var(--tw-prose-hr)",
          "@screen lg": {
            marginLeft: "calc(--spacing(12) * -1)",
            marginRight: "calc(--spacing(12) * -1)",
          },
        },

        // Tables
        table: {
          width: "100%",
          tableLayout: "auto",
          textAlign: "left",
          fontSize: "var(--text-sm)",
        },
        thead: {
          borderBottomWidth: "1px",
          borderBottomColor: "var(--tw-prose-th-borders)",
        },
        "thead th": {
          color: "var(--tw-prose-headings)",
          fontWeight: "var(--font-weight-semibold)",
          verticalAlign: "bottom",
          paddingBottom: "--spacing(2)",
        },
        "thead th:not(:first-child)": {
          paddingLeft: "--spacing(2)",
        },
        "thead th:not(:last-child)": {
          paddingRight: "--spacing(2)",
        },
        "tbody tr": {
          borderBottomWidth: "1px",
          borderBottomColor: "var(--tw-prose-td-borders)",
        },
        "tbody tr:last-child": {
          borderBottomWidth: 0,
        },
        "tbody td": {
          verticalAlign: "baseline",
        },
        "tbody td p": {
          marginTop: "0",
          marginBottom: "0",
        },
        tfoot: {
          borderTopWidth: "1px",
          borderTopColor: "var(--tw-prose-th-borders)",
        },
        "tfoot td": {
          verticalAlign: "top",
        },
        ":is(tbody, tfoot) td": {
          paddingTop: "--spacing(2)",
          paddingBottom: "--spacing(2)",
        },
        ":is(tbody, tfoot) td:not(:first-child)": {
          paddingLeft: "--spacing(2)",
        },
        ":is(tbody, tfoot) td:not(:last-child)": {
          paddingRight: "--spacing(2)",
        },
      },
    },
  };
}
