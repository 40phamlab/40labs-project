package expo.modules.orbitpinnedtransport

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import java.util.concurrent.TimeUnit
import javax.net.ssl.HostnameVerifier
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSession
import javax.net.ssl.X509TrustManager
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class OrbitPinnedTransportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OrbitPinnedTransport")

    AsyncFunction("request") { url: String, method: String, headers: Map<String, String>, body: String?, fingerprint: String ->
      performPinnedRequest(url, method, headers, body, fingerprint)
    }
  }

  private fun performPinnedRequest(
    url: String,
    method: String,
    headers: Map<String, String>,
    body: String?,
    fingerprint: String,
  ): Map<String, Any> {
    require(url.startsWith("https://")) { "Secure Orbit transport requires HTTPS" }
    require(fingerprint.matches(Regex("^[a-fA-F0-9]{64}$"))) { "Invalid Orbit certificate fingerprint" }

    val expectedFingerprint = fingerprint.lowercase()
    val trustManager = object : X509TrustManager {
      override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {
        throw CertificateException("Client certificates are not accepted")
      }

      override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {
        val certificate = chain.firstOrNull() ?: throw CertificateException("Server certificate is missing")
        certificate.checkValidity()
        if (certificate.subjectX500Principal != certificate.issuerX500Principal) {
          throw CertificateException("Orbit server certificate is not self-signed")
        }
        certificate.verify(certificate.publicKey)
        val actualFingerprint = sha256Hex(certificate.encoded)
        if (!MessageDigest.isEqual(
            actualFingerprint.toByteArray(Charsets.US_ASCII),
            expectedFingerprint.toByteArray(Charsets.US_ASCII),
          )
        ) {
          throw CertificateException("Orbit server certificate fingerprint does not match")
        }
      }

      override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
    }

    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(null, arrayOf(trustManager), SecureRandom())

    val hostnameVerifier = HostnameVerifier { _, session: SSLSession ->
      val certificate = session.peerCertificates.firstOrNull() as? X509Certificate
      certificate != null && sha256Hex(certificate.encoded) == expectedFingerprint
    }
    val client = OkHttpClient.Builder()
      .sslSocketFactory(sslContext.socketFactory, trustManager)
      .hostnameVerifier(hostnameVerifier)
      .connectTimeout(8, TimeUnit.SECONDS)
      .readTimeout(8, TimeUnit.SECONDS)
      .build()
    val requestBuilder = Request.Builder().url(url)
    headers.forEach { (name, value) -> requestBuilder.header(name, value) }
    val requestBody = body?.toRequestBody("application/json; charset=utf-8".toMediaType())
    requestBuilder.method(method.uppercase(), requestBody)

    client.newCall(requestBuilder.build()).execute().use { response ->
      val responseBody = response.body?.string().orEmpty()
      val responseHeaders = response.headers.toMultimap()
        .mapValues { entry -> entry.value.joinToString(", ") }
      return mapOf("status" to response.code, "headers" to responseHeaders, "body" to responseBody)
    }
  }

  private fun sha256Hex(value: ByteArray): String =
    MessageDigest.getInstance("SHA-256").digest(value).joinToString("") { "%02x".format(it) }

}
