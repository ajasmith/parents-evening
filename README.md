# Parent's Evening Session Clock

A configurable browser-based session clock for parents' evenings. It displays
the current session start time, plays a bell as sessions change, and includes
fullscreen and screen wake-lock support.

## Live site

[Open the Parent's Evening Session Clock](https://ajasmith.github.io/parents-evening/)

## Development and deployment

Open `index.html` directly or serve the repository directory to work locally.
The source HTML references `styles.css` and `script.js` without manually
maintained version parameters.

Run `npm run build` to create the production site in `dist`. The build gives
the stylesheet and script content-hashed filenames and updates the generated
HTML to reference them. GitHub Actions runs this build and deploys `dist` to
GitHub Pages whenever `main` is updated.

Before the first workflow deployment, change the repository's **Settings >
Pages > Build and deployment > Source** from **Deploy from a branch** to
**GitHub Actions**. This is a one-time repository setting.

## Settings

Use the settings button (&#x2699;) in the bottom-left corner to configure the
title, logo, schedule, clock format, and display colours. Selecting **Save**
reloads the page with the settings in the URL. Bookmark the resulting page or
copy its URL to retain and share that configuration.

The logo URL is checked when settings are opened, a saved configuration is
selected, or the logo field loses focus. An unavailable image displays a
warning in settings but does not prevent saving or change the URL.

The **Saved configurations** section can fill in the branding settings for a
school. Profiles are loaded from [`profiles.json`](profiles.json):

Add another object to that file to make a new school available. Each profile
requires a unique `id`, display `name`, `title`, HTTP or HTTPS `logoUrl`,
boolean `matchLogoColour`, and six-digit `background` and `foreground` colours
including the leading `#`. You can adjust any populated settings before
selecting **Save**.

If you would like to have your school's profile added to this list, please contact me or raise an issue via github.

### URL parameters

Settings can also be provided directly with these optional query-string
parameters. Saving removes parameters whose values match the defaults, keeping
the resulting URL as short as possible. Use a profile's `id` to apply its
branding defaults; any other parameters in the same URL override the values
from that profile.

| Parameter | Description | Default |
| --- | --- | --- |
| `id` | Saved profile ID from `profiles.json` | None |
| `title` | Page heading | `Parents Evening` |
| `logo` | HTTP or HTTPS URL for an image displayed above the title | None |
| `matchLogoColour` | Set to `true` to render the logo in the selected text colour | `false` |
| `start` | First session start in four-digit 24-hour time | `1600` |
| `end` | Final session end in four-digit 24-hour time | `1930` |
| `duration` | Session duration in whole minutes | `5` |
| `clock` | Clock display format (`24` or `12`) | `24` |
| `background` | Background colour as a six-digit RGB hex value without `#` | `2F4183` |
| `foreground` | Text colour as a six-digit RGB hex value without `#` | `FFFFFF` |

Legacy URLs using `invertLogo` remain supported. Its value is interpreted as
`matchLogoColour` and is converted to the new parameter when settings are
saved.

For example, this URL applies The Oxford Academy profile:

<https://ajasmith.github.io/parents-evening/?id=oxford-academy>

Adding `title=Year+8+Parents%27+Evening` to that URL changes only the title
while retaining the profile's logo and colours.

For example, this URL creates a five-minute Year 8 schedule using a 12-hour
clock and a dark background:

<https://ajasmith.github.io/parents-evening/?title=Year+8+Parents%27+Evening&start=1800&end=2000&duration=5&clock=12&background=1A1A26&foreground=FFFFFF>

The bell is enabled by default. Muting or enabling it is saved in browser
storage, so the choice persists when settings reload the page. It is not added
to the URL. Browser autoplay policies may require an interaction with the page
before audio can play.
