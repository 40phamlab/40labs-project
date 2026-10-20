import ExpoModulesCore
import Foundation
import Security
import CryptoKit

private final class OrbitPinnedSessionDelegate: NSObject, URLSessionDelegate {
  private let expectedFingerprint: String

  init(expectedFingerprint: String) {
    self.expectedFingerprint = expectedFingerprint.lowercased()
  }

  func urlSession(
    _ session: URLSession,
    didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
  ) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
          let serverTrust = challenge.protectionSpace.serverTrust,
          let certificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    let certificateData = SecCertificateCopyData(certificate) as Data
    let actualFingerprint = SHA256.hash(data: certificateData)
      .map { String(format: "%02x", $0) }
      .joined()
    guard constantTimeEqual(actualFingerprint, expectedFingerprint) else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    let anchors = [certificate] as CFArray
    guard SecTrustSetAnchorCertificates(serverTrust, anchors) == errSecSuccess,
          SecTrustSetAnchorCertificatesOnly(serverTrust, true) == errSecSuccess,
          SecTrustSetPolicies(serverTrust, SecPolicyCreateBasicX509()) == errSecSuccess else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    var evaluationError: CFError?
    guard SecTrustEvaluateWithError(serverTrust, &evaluationError) else {
      completionHandler(.cancelAuthenticationChallenge, nil)
      return
    }

    completionHandler(.useCredential, URLCredential(trust: serverTrust))
  }

  private func constantTimeEqual(_ left: String, _ right: String) -> Bool {
    let leftBytes = Array(left.utf8)
    let rightBytes = Array(right.utf8)
    guard leftBytes.count == rightBytes.count else { return false }
    var mismatch: UInt8 = 0
    for index in leftBytes.indices {
      mismatch |= leftBytes[index] ^ rightBytes[index]
    }
    return mismatch == 0
  }
}

public final class OrbitPinnedTransportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OrbitPinnedTransport")

    AsyncFunction("request") { (url: String, method: String, headers: [String: String], body: String?, fingerprint: String) async throws -> [String: Any] in
      guard url.lowercased().hasPrefix("https://"), fingerprint.range(of: "^[a-fA-F0-9]{64}$", options: .regularExpression) != nil else {
        throw NSError(domain: "OrbitPinnedTransport", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid secure Orbit request"])
      }
      guard let requestUrl = URL(string: url) else {
        throw NSError(domain: "OrbitPinnedTransport", code: 2, userInfo: [NSLocalizedDescriptionKey: "Invalid Orbit endpoint"])
      }

      var request = URLRequest(url: requestUrl, timeoutInterval: 8)
      request.httpMethod = method.uppercased()
      headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }
      request.httpBody = body?.data(using: .utf8)

      let delegate = OrbitPinnedSessionDelegate(expectedFingerprint: fingerprint)
      let configuration = URLSessionConfiguration.ephemeral
      configuration.waitsForConnectivity = false
      let session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
      defer { session.invalidateAndCancel() }
      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw NSError(domain: "OrbitPinnedTransport", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid Orbit response"])
      }

      let responseHeaders = httpResponse.allHeaderFields.reduce(into: [String: String]()) { result, entry in
        result[String(describing: entry.key)] = String(describing: entry.value)
      }
      return [
        "status": httpResponse.statusCode,
        "headers": responseHeaders,
        "body": String(data: data, encoding: .utf8) ?? ""
      ]
    }
  }
}
