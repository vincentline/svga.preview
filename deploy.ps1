Write-Host "Deploying docs to gh-pages..."
git subtree push --prefix docs origin gh-pages
if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed." -ForegroundColor Red
}
