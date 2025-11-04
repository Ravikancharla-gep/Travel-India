# PowerShell script to set up .env file with MongoDB connection string
$envContent = @"
MONGODB_URI=mongodb+srv://ravikrc02_db_user:@Cs6147246@travel-india.sbccrz9.mongodb.net/route-map-india?retryWrites=true&w=majority
PORT=3001
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
Write-Host "✅ .env file created successfully!"

