# Git guide for our team

All of this happens in VS Code's **Source Control** panel (Ctrl + Shift + G).

## The idea

- **Commit** = save a checkpoint on *your* PC.
- **Sync** = download teammates' commits, then upload yours to GitHub.
- Commit without Sync = nobody else sees your work.

## Every time you work

1. **Sync** first (the circular arrows, bottom-left).
2. Edit **your own file** (see the file table in README.md).
3. Type a message saying what changed, e.g. `style result cards`.
4. Click **Commit**, then **Sync**.

## Letters next to files

| Letter | Meaning |
| --- | --- |
| M | Modified |
| U | New file, not committed yet |
| D | Deleted |

## When something goes wrong

- **"Pull first" / push rejected:** someone uploaded before you. Click **Sync**.
- **Merge conflict:** VS Code shows *Accept Current / Accept Incoming / Accept Both*. Choose, save, commit.
- **Want to undo your edits to a file:** hover it → **Discard Changes**. This cannot be undone.

## Uploading through the GitHub website

Fine for adding a new file. But if you upload a file someone else also changed, your upload silently replaces their version. For existing files, use VS Code: Sync, edit, Commit, Sync.

## Live Share sessions

Only the **host** commits and syncs. Guests' edits land in the host's files.

## Never commit

API keys or passwords. If one slips in, tell the team leader right away.
