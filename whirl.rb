cask 'whirl' do
  version '1.0.0'
  sha256 :no_check  # We'll update this with the actual SHA256

  url "https://github.com/VincentSamuelPaul/whirl-frontend/releases/download/v#{version}/Whirl-#{version}-arm64.dmg"
  name 'Whirl'
  homepage 'https://github.com/VincentSamuelPaul/whirl-frontend'
  desc 'Circle 2 Search for MacOS'

  app 'Whirl.app'

  zap trash: [
    '~/Library/Application Support/Whirl',
    '~/Library/Preferences/com.paul.learn.plist',
    '~/Library/Saved Application State/com.paul.learn.savedState'
  ]
end 