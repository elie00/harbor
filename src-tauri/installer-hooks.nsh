!macro NSIS_HOOK_PREINSTALL
  ; Harbor: stop the stremio-server sidecar so its .exe isn't locked when we overwrite it during an update.
  nsExec::Exec 'taskkill /F /FI "IMAGENAME eq stremio-server-*"'
  Pop $0
  Sleep 800
!macroend
