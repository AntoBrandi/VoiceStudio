# Support page

The support page asks for no money: it has no donation goal, payment links or sponsor list. Under the official VoiceStudio logo it offers Star and Discord community links, the Pro card, and an icon grid for contact channels. No accordion hides those actions. Controls support keyboard navigation, and decorative interaction animations respect reduced-motion preferences.

Support lives in Settings → Support; workspace headers carry only Search. Integrations is reachable from the sidebar and opens the directory; sponsored entries carry a Featured badge on their card. There is no app-wide footer or partnership form; contact details live on this page and in Settings.


The Support page Pro card opens a dedicated `/pro` page; the top bar has no Pro shortcut. It leads with $99 per-user yearly, $199 per-user lifetime, and Enterprise contact cards. Pro and Lifetime include user selectors, live totals, and links that preserve the selected plan and quantity on website checkout. The page then presents the proposed application-licensing, batch-rule, revision-history, delivery and preflight benefits. Remote compute devices, remote workers and GPU sharing are VoiceStudio Pro features and are no longer included in the open-source app. Recipes, watch folders and core local generation remain free and unlimited; the Pro and Support introductions do not imply that a purchase unlocks voice cloning. The open-source page does not expose licence activation; that flow belongs to the separate Pro distribution. Checkout stays disabled until the paid tools, quantity fulfilment, merchant offer, and terms pass the release gates. Commercial software distribution terms remain a separate agreement. See [the Pro specification](specs/desktop-pro-page.md).

On the Integrations page, only entries with a built-in setup show Works with VoiceStudio and capability chips; the rest are marked External link. Setup details and source links are recorded in [the directory notes](integration-directory.md).

License keys require OS-backed encryption; activation fails with a storage error
when the keyring is unavailable or Electron selects plaintext storage. Existing
legacy key files remain readable for deactivation.
