Pod::Spec.new do |s|
  s.name           = 'OrbitPinnedTransport'
  s.version        = '1.0.0'
  s.summary        = 'Fingerprint-pinned HTTPS transport for Orbit Worker'
  s.description    = 'Per-request TLS trust anchored to the fingerprint delivered by a pairing QR code.'
  s.license        = { :type => 'MIT' }
  s.author         = '40Labs'
  s.homepage       = 'https://40labs.health'
  s.platforms      = { :ios => '15.0' }
  s.source         = { :path => '.' }
  s.source_files   = '**/*.{h,m,mm,swift}'
  s.dependency 'ExpoModulesCore'
end
