# Setup — Tesla vs Panda tracker

The site works standalone (data saved in your browser). To share data across
devices/people, connect it to a Google Sheet — takes about 5 minutes.

## 1. Create the Sheet
1. Go to sheets.google.com and create a new blank spreadsheet.
2. Name it whatever you like, e.g. "Tesla vs Panda".
3. You don't need to add any columns — the script creates the `Entries` tab
   and headers automatically on first use.

## 2. Add the script
1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete any placeholder code in `Code.gs`.
3. Paste in the contents of the `Code.gs` file provided alongside this one.
4. Click the disk icon (or Ctrl/Cmd+S) to save.

## 3. Deploy as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, authorize the permissions Google asks for (it's your own
   script accessing your own Sheet).
5. Copy the **Web app URL** it gives you — looks like
   `https://script.google.com/macros/s/AKfycb.../exec`.

## 4. Using the site
The script URL is now hardcoded into `index.html`, so there's nothing to
paste in — it connects on load automatically.

1. Open `index.html` in your browser.
2. Click **Admin** in the top-right, enter the admin password (default:
   `panda2008` — change it right away under "Change admin password").
3. Odometer readings are logged from the Admin tab, so only someone with the
   password can add entries. The Tracker tab is read-only.

If you ever redeploy and get a new script URL, update the `SCRIPT_URL`
constant near the top of the `<script>` block in `index.html`.

**Note on the hardcoded URL:** anyone who opens `index.html` can read it in
the page source, and the web app is deployed as "anyone with the link" — so
anyone you share the file with can read and write your Sheet directly. The
admin password gates the UI, not the underlying Sheet access.

## Notes
- The Admin tab (rates + Sheets URL + password) is protected by a simple
  password check in the page's JavaScript — enough to stop casual snooping
  by friends/family you've shared the link with, but not real security,
  since anyone could view the page source. Don't rely on it for sensitive
  data.
- If you ever change the deployment, Google gives you a *new* URL — update
  it in Admin again.
- Anyone with the web app URL can read/write entries — it's not secret, so
  don't post it publicly if you'd rather keep the data private.
- You can always open the Sheet directly to edit or fix a row by hand.
- The Sheet now only stores `Date`, `Odometer_km`, and `Notes` — all costs
  are calculated on the fly from the rates you set in Admin, so nothing
  else needs to be stored per entry.

## Per-entry overrides
When logging an entry you can optionally enter the **kWh charged** and the
**gasoline price (€/L)** at that time:

- **kWh charged** — uses your real measured energy for that stretch instead
  of estimating from the default kWh/100km rate. Only applies to the vehicle
  you actually drive (the source); hypothetical vehicles always use their
  own consumption rate.
- **Gasoline price €/L** — the pump price at that moment, applied to any
  petrol/diesel vehicle in the comparison.
- Leave either blank and it falls back to the default rate set in Admin.

If you already had a Sheet before this feature, add two columns named
exactly `kWh` and `Fuel_Price` between `Odometer_km` and `Notes`, or delete
the `Entries` tab and let the script recreate it with the right headers.

## Infrastructure costs
Admin has an **Infrastructure** section for one-off costs: solar panels,
batteries, inverter, car socket, wall box, and miscellaneous. The total is
added to the break-even calculation as part of what you spent switching, and
shown as its own line on the Break-even card.

## Admin settings sync
When Google Sheets sync is connected, your Admin values (starting odometer,
all vehicles and their rates, infrastructure costs, and which vehicle is
selected for comparison) are saved to a **Settings** tab in the same Sheet,
created automatically on first save.

- Saving in Admin writes them to the Sheet; loading the page reads them back,
  so a second device or another person's browser picks up the same setup.
- The Sheet is the source of truth when connected — on page load, stored
  settings overwrite whatever that browser had locally.
- Two things are **never** synced: your admin password and the script URL
  itself. The password stays local because the web app is deployed as
  "anyone with the link," so anything in the Sheet is readable by anyone
  holding that URL.
- Same privacy note applies to the rest: purchase prices and infrastructure
  costs live in that Sheet, readable by anyone with the script URL — so keep
  the URL private.
- Requires a **redeploy** of the script (Deploy → Manage deployments → Edit →
  New version) since it adds new actions.
- Don't edit the Settings tab by hand — it holds a single JSON value in A1
  that the app writes and reads.
