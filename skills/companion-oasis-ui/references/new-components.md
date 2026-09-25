# Creating additional UI from scratch

Work from the requested user behavior, not an arbitrary list of card types.
For example, a bike comparison needs comparable attributes and saved choices;
a calendar needs dated records and navigation; a calorie view needs dated
measurements and units. Identify data that actually exists and what must be
supplied or connected. UI creation does not itself provision those integrations.

## Extend the application coherently

1. Inspect `lib/types.ts`, `lib/store.mjs`, `components/companion.tsx`, and the
   relevant routes. Follow their current contracts rather than assuming a new
   component can persist extra properties or accept arbitrary JSON.
2. Implement a named React component in `components/`, preferably separating
   substantial new views from the existing dashboard component. Pass validated
   data and explicit callbacks. Inherit design tokens and share controls.
3. When a new block type or data shape is required, extend TypeScript types and
   runtime validation together. Preserve existing IDs and old saved workspaces.
   Supply backward-compatible defaults or an explicit migration if required.
   Check history restore compatibility before introducing a new persisted shape.
4. Wire the renderer, creation/editing controls, loading/error states, and actual
   save/reload flow. Extend the agent's schema documentation so later jobs can
   create and update the component. A component that is unreachable from the
   app or dropped by validation is not finished.
5. Inspect the Instinct event contract if the view receives external data.
   Existing ingestion accepts items for existing supported blocks; a new type
   does not automatically become an ingestion target. Extend and verify the
   endpoint intentionally when needed, preserving bearer authorization and
   idempotency. Never embed or display the integration key in generated UI.
6. Test meaningful new behavior and invalid input handling. Run `npm run build`
   and `npm test`. Inspect actual desktop and mobile rendering; verify keyboard
   interaction and persistence with disposable test data, not personal data.

Do not evaluate stored JSX, JavaScript, CSS, or HTML. Generated components are
reviewable application source compiled in the development/build environment.
User records remain data and cannot change authentication or execution policy.

## Publishing boundary

Follow the existing box deployment instructions in README.md. Build in the
configured development environment, retain a previous artifact, ship only the
intended application files, and restart only Companion. Preserve `.env`, `.data`,
and the Instinct token. Verify the live changed flow before claiming deployment.

For a future in-app builder, the required sequence is an isolated checkout →
source generation using this skill → build/tests → rendered preview → publish
and rollback support. This is a specification for missing infrastructure, not
an available tool. A source edit on the running box is not a substitute.
