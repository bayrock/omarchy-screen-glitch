import QtQuick
import Quickshell
import Quickshell.Io

// Omarchy shell plugin: toggles a full-screen CRT/glitch Hyprland shader.
// There's no window. The state lives in Omarchy's Hyprland toggle directory (see
// bin/screen-glitch), so it survives reboots and shell restarts. This item just
// answers the shell's IPC:
//
//   omarchy-shell shell toggle bayrock.screen-glitch '{}'
//   omarchy-shell shell call   bayrock.screen-glitch status ''
Item {
  id: root

  property var manifest
  readonly property string script: (manifest && manifest.__sourceDir ? manifest.__sourceDir : "") + "/bin/screen-glitch"

  // read by the shell's toggle(); synced from disk on load
  property bool opened: false

  function open(payload) {
    Quickshell.execDetached([root.script, "on"])
    root.opened = true
  }

  function close() {
    Quickshell.execDetached([root.script, "off"])
    root.opened = false
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open("")
  }

  function status() {
    return root.opened ? "on" : "off"
  }

  onManifestChanged: if (root.manifest) probe.running = true

  Process {
    id: probe
    command: [root.script, "status"]
    stdout: StdioCollector {
      onStreamFinished: root.opened = text.trim() === "on"
    }
  }
}
