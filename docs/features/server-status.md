# Server status

**Status:** proposed

Enables checking for server liveness, which is useful for deployment, monitoring and load balancing. It also provides a view which administrators can display to check the status of the server.

## Out of scope

- readiness and dependency checks: the endpoint only tells whether the API responds; more advanced checks can be added once there's something to check (see [Roadmap](../roadmap.md#planned))
- access control: the endpoint and the page are public
- information about the deployment, such as the version or the environment
- history of the server's status

## Visual requirements

### Status page

Structure
- a PrimeReact `Fieldset`
  - **V1** horizontally and vertically centered
    - its size should not change when the state of its items changes
  - **V2** "Server status" title (using `legend` property, also used as the page's title) preceded by either a `ti-heartbeat`, a `ti-activity-heartbeat` or a `ti-heart-rate-monitor` icon (to be decided during implementation)
  - **V3** Status:
    - Available - accompanied by a green `pi-check-circle` icon
    - Connecting... - accompanied by a spinning amber or orange `pi-spinner` icon
    - Unavailable - accompanied by a red `pi-exclamation-circle` icon
    - Paused - accompanied by a muted `pi-pause-circle` icon
    - the icons should be positioned so that change of the text doesn't change the position of the icon
    - changes of the status should be announced by screen readers
  - **V4** Uptime:
    - the time since the server was started, in days, hours, minutes and seconds, with abbreviated units and without leading zeros (`12d 4h 5m 6s`)
    - value for each unit should be spaced and aligned so that change of the value doesn't change the position of the other values: right-aligned in slots of two digits (three for days), with digits of equal width
    - value for days should be spaced so that change of the value doesn't change the width of the entire fieldset up to a maximum of 999 days; higher values can change the width, but should be displayed correctly
    - the time can be replaced by a `Skeleton` PrimeReact component
    - the Uptime item can be displayed as disabled: a muted label, and a dash instead of the time
  - **V5** a button with two states, both of the same width:
    - Pause polling - accompanied by a `ti-player-pause` icon
    - Resume polling - accompanied by a `ti-player-play` icon

## Functional requirements

### Status page

A request *times out* when it gets no response within a second. It *fails* when it ends sooner without success: the server responds with an error or refuses the connection, or the browser is offline. Timeouts are consecutive as long as no request succeeds or fails between them; their count also starts from zero whenever the status changes to "Unavailable" or "Paused".

- **F1** the page is rendered with the status "Available" and the uptime at the time of rendering
- **F2** the uptime is polled from the server every second, and every 5 seconds while the status is "Unavailable"
- **F3** if a request times out:
  - the request should be aborted and Status should change to "Connecting..."
  - the Uptime value should be replaced by a `Skeleton` PrimeReact component
- **F4** if 5 consecutive requests time out:
  - the status should change to "Unavailable" (instead of "Connecting...")
  - the Uptime item should be displayed as disabled
- **F5** if a request fails:
  - the status should change to "Unavailable" immediately
  - the Uptime item should be displayed as disabled
- **F6** if the server responds when the status is "Connecting..." or "Unavailable":
  - the status should change to "Available"
  - the Uptime item should display the value again
- **F7** if the user clicks the "Pause polling" button:
  - the polling should be stopped, and a request in progress aborted; its response should not change the display, even if it arrives
  - the Status should change to "Paused" and the Uptime item should be displayed as disabled
  - the button should change to "Resume polling"
- **F8** if the user clicks the "Resume polling" button:
  - the server should be polled immediately, then every second
  - until the server responds, the Status should be "Connecting..." and the Uptime value should be replaced by a `Skeleton` PrimeReact component
  - the button should change to "Pause polling"

## Technical requirements

- **T1** the status endpoint must return `200 OK` status on any `GET` request - important for automated health checks

## Plan of attack

### Notes

- the JSON response contains the uptime, which the page polls; it isn't a requirement, but the page needs it
- the uptime is measured from the start of the process, not from the loading of the controller module as now; the props refresh check in `CLAUDE.md` relies on the uptime resetting, so it needs another signal
- polls start at a fixed rate, a second after the start of the previous request; scheduling them a second after the previous response would add up the round trips, and the uptime would regularly repeat a second
- the page shows the uptime of the latest response, without counting on between responses: a counter that stops is a visible symptom of a problem
- responses of aborted requests, whether they timed out (F3) or polling was paused (F7), never change the display, so that a late response can't overwrite a newer state
- the Tabler icons for pausing and resuming are a deliberate exception to the rule of using PrimeIcons where they have the icon: Tabler's pause icon (two outlined rectangles) looks better on a button than that of PrimeIcons (two line segments), and the play icon follows it for consistency
- health checkers usually send no `Accept` header, or `*/*`; both get JSON, not a rendered page, and `HEAD` requests are answered by the `GET` route (verified with Hono's `accepts()` and the rendering middleware's settings)
- `POST /status/test` and its request schema, a demonstration without a function, are to be removed
