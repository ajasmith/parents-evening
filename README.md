# Parent's Evening Session Clock

A configurable browser-based session clock for parents' evenings. It displays
the current session start time, plays a bell as sessions change, and includes
fullscreen and screen wake-lock support.

## Live site

[Open the Parent's Evening Session Clock](https://ajasmith.github.io/parents-evening/)

## Settings

Use the settings button (&#x2699;) in the bottom-left corner to configure the
title, logo, schedule, clock format, and display colours. Selecting **Save**
reloads the page with the settings in the URL. Bookmark the resulting page or
copy its URL to retain and share that configuration.

The **Saved configurations** section can fill in the branding settings for a
school:

| School | Title | Background | Text |
| --- | --- | --- | --- |
| Chandlings | `Parents' Evening` | `2F4183` | `FFFFFF` |
| Cherwell | `Cherwell PCE` | `1A1A26` | `FFFFFF` |

You can adjust any of the populated settings before selecting **Save**.

### URL parameters

Settings can also be provided directly with these optional query-string
parameters:

| Parameter | Description | Default |
| --- | --- | --- |
| `title` | Page heading | `Parents Evening` |
| `logo` | HTTP or HTTPS URL for an image displayed above the title | None |
| `invertLogo` | Set to `true` to render the logo in white | `false` |
| `start` | First session start in four-digit 24-hour time | `1600` |
| `end` | Final session end in four-digit 24-hour time | `1930` |
| `duration` | Session duration in whole minutes | `5` |
| `clock` | Clock display format (`24` or `12`) | `24` |
| `background` | Background colour as a six-digit RGB hex value without `#` | `2F4183` |
| `foreground` | Text colour as a six-digit RGB hex value without `#` | `FFFFFF` |

For example, this URL creates a five-minute Year 8 schedule using a 12-hour
clock and a dark background:

<https://ajasmith.github.io/parents-evening/?title=Year+8+Parents%27+Evening&start=1800&end=2000&duration=5&clock=12&background=1A1A26&foreground=FFFFFF>

The bell is enabled by default. Browser autoplay policies may require an
interaction with the page before audio can play.
