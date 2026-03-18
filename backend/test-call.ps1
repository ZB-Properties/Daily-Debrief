$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTliN2UzY2U1YmRiMTNlNTFjYTZiNjEiLCJpYXQiOjE3NzI1NzQ4OTQsImV4cCI6MTc3MjU3NTc5NH0.8NrDy_sBKMRAjpUXStZ5cMO8UnjFwFFABLJW1xZGppQ"
$receiverId = "699b7e41e5bdb13e51ca6b6b"

$body = @{
    receiverId = $receiverId
    type = "audio"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:7900/api/calls/initiate" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
        } `
        -Body $body

    Write-Host "✅ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}