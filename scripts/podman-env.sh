#!/usr/bin/env bash
# Normalizes Podman-related XDG paths when terminals inherit sandboxed app dirs
# (for example Snap or Flatpak VS Code), which can break rootless storage.

set -euo pipefail

kg_podman_env_notice() {
  local message="$1"

  if [[ "${KG_PODMAN_ENV_NOTICE_SHOWN:-0}" != "1" ]]; then
    printf '→ %s\n' "$message" >&2
    export KG_PODMAN_ENV_NOTICE_SHOWN=1
  fi
}

kg_real_home() {
  local passwd_home

  passwd_home="$(getent passwd "$(id -un)" | cut -d: -f6)"
  if [[ -n "$passwd_home" ]]; then
    printf '%s\n' "$passwd_home"
    return 0
  fi

  printf '%s\n' "$HOME"
}

kg_is_sandboxed_home_path() {
  local path="$1"
  local real_home="$2"

  [[ -z "$path" ]] && return 1

  case "$path" in
    "$real_home"/snap/*|"$real_home"/.var/app/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

kg_prepare_podman_env() {
  local real_home current_data_home current_config_home

  real_home="$(kg_real_home)"
  current_data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
  current_config_home="${XDG_CONFIG_HOME:-$HOME/.config}"

  if kg_is_sandboxed_home_path "$current_data_home" "$real_home" || \
     kg_is_sandboxed_home_path "$current_config_home" "$real_home"; then
    kg_podman_env_notice \
      "Detected sandboxed XDG paths for Podman; normalizing to ${real_home}/.local/share and ${real_home}/.config."
    export XDG_DATA_HOME="$real_home/.local/share"
    export XDG_CONFIG_HOME="$real_home/.config"
  fi

  kg_prepare_podman_storage_conf "$real_home"
}

kg_prepare_podman_storage_conf() {
  local real_home config_home storage_conf runtime_dir override_conf

  real_home="$1"
  config_home="${XDG_CONFIG_HOME:-$real_home/.config}"
  storage_conf="$config_home/containers/storage.conf"

  [[ -f "$storage_conf" ]] || return 0

  if ! grep -Eq "${real_home}/(snap/|\\.var/app/)" "$storage_conf"; then
    return 0
  fi

  runtime_dir="${XDG_RUNTIME_DIR:-/tmp}"
  override_conf="$runtime_dir/kgp1-podman-storage.conf"

  mkdir -p "$(dirname "$override_conf")"

  sed \
    -e "s#${real_home}/snap/[^\"']*/\\.local/share#${real_home}/.local/share#g" \
    -e "s#${real_home}/\\.var/app/[^\"']*/data#${real_home}/.local/share#g" \
    -e "s#${real_home}/snap/[^\"']*/\\.config#${real_home}/.config#g" \
    -e "s#${real_home}/\\.var/app/[^\"']*/config#${real_home}/.config#g" \
    "$storage_conf" > "$override_conf"

  kg_podman_env_notice \
    "Detected sandboxed Podman storage.conf paths; using a normalized runtime override for this command."
  export CONTAINERS_STORAGE_CONF="$override_conf"
}
