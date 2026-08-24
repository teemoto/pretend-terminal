# Built-in theme contrast

Pretend Terminal audits its bundled themes against WCAG contrast thresholds. The values below are contrast ratios between each foreground token and the theme background.

- Standard-sized text tokens must meet **4.5:1**.
- The accent token, which also provides the keyboard focus outline, must meet **3:1**; all bundled accents currently also meet **4.5:1**.

| Theme     |    Text |  Muted | Accent / link / focus | Success |  Error | Lowest prompt token |
| --------- | ------: | -----: | --------------------: | ------: | -----: | ------------------: |
| `default` | 14.36:1 | 7.01:1 |                9.63:1 |  9.45:1 | 4.71:1 |              7.16:1 |
| `dracula` | 13.36:1 | 7.33:1 |                5.90:1 | 10.38:1 | 4.53:1 |              5.97:1 |
| `matrix`  | 17.76:1 | 7.26:1 |               15.14:1 | 15.87:1 | 7.50:1 |             15.09:1 |
| `amber`   | 15.27:1 | 8.14:1 |               11.12:1 | 15.73:1 | 8.36:1 |             10.07:1 |
| `light`   | 15.55:1 | 5.16:1 |                4.94:1 |  4.79:1 | 6.18:1 |              4.71:1 |

This audit covers the bundled tokens only. If you override public CSS variables or create a custom theme, review the resulting combinations in your own application.
