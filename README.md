# Screen Glitch

A one-key full-screen CRT/glitch look for [Omarchy](https://omarchy.org),
modeled on the screen filter in the php2shell exploit clip. It's a Hyprland
screen shader with:

- chromatic aberration that grows toward the edges
- a horizontal ghost smear
- scanlines, a diagonal halftone screen, vignette, grain and flicker
- random tearing/RGB-split bursts every few seconds

The state persists across reboots and shell restarts.

## Install

```bash
omarchy plugin add https://github.com/bayrock/omarchy-screen-glitch.git --enable
```

## Use

```bash
omarchy-shell shell toggle bayrock.screen-glitch '{}'
omarchy-shell shell call bayrock.screen-glitch status ''   # on / off
```

`bin/screen-glitch [toggle|on|off|status]` does the same without the shell.

### Keybinding

`~/.config/hypr/bindings.lua`:

```lua
o.bind("SUPER + CTRL + SHIFT + G", "Toggle screen glitch", "omarchy-shell shell toggle bayrock.screen-glitch '{}'")
```

### Omarchy menu entry

`~/.config/omarchy/extensions/omarchy-menu.jsonc` (Trigger → Toggle):

```jsonc
"trigger.toggle.glitch": {"icon":"󰹑","label":"Screen Glitch","action":"omarchy-shell shell toggle bayrock.screen-glitch '{}'","checked":"[[ $(omarchy-shell shell call bayrock.screen-glitch status '') == on ]]"},
```

## Tuning

All the strengths are constants at the top of `shaders/glitch.frag`
(`INTENSITY`, `ABERRATION`, `GHOST`, `SCANLINES`, `BURST_EVERY`, ...). Edit
them and toggle off and on again to reload.

## Notes

- **How it's turned on:** turning it on writes
  `~/.local/state/omarchy/toggles/hypr/screen-glitch.lua`. Omarchy's Hyprland
  config loads that file, and it sets `decoration.screen_shader` plus
  `debug.damage_tracking = 0`. The shader's `time` uniform only advances with
  damage tracking off, so **GPU use goes up while it's on**.
- **Turn it off before removing the plugin.** The toggle file points at the
  shader inside the plugin folder.

## License

[MIT](LICENSE) © 2026 shojo.me
