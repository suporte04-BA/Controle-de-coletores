Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -like '*controle-coletores*' -and
    ($_.Name -eq 'node.exe' -or $_.Name -eq 'cmd.exe' -or $_.Name -eq 'concurrently.exe')
  } |
  ForEach-Object {
    Write-Output ("kill " + $_.ProcessId + " " + $_.Name)
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }
