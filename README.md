# npm package provenance stats

![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)
[![Update Attestations Data](https://github.com/j4ckofalltrades/npm-package-provenance-stats/actions/workflows/update-attestations.yml/badge.svg)](https://github.com/j4ckofalltrades/npm-package-provenance-stats/actions/workflows/update-attestations.yml)
[![Deploy static content to Pages](https://github.com/j4ckofalltrades/npm-package-provenance-stats/actions/workflows/deploy.yml/badge.svg)](https://github.com/j4ckofalltrades/npm-package-provenance-stats/actions/workflows/deploy.yml)

This site shows which of the top 500 most-downloaded packages (by monthly download count) on [npm](https://npmjs.com) have been uploaded with attestations; data is updated daily.

The list of most-downloaded packages are extracted from the [download-counts](https://npmjs.com/package/download-counts) package.

The attestation details for the latest version of each package is fetched from `registry.npmjs.org/<package>/latest` endpoint.
If a package was uploaded with attestations, the attestations url is set in the `dist.attestations.url` field.

See below for an abridged response payload example for the `vite` package.

```json
{
  "name": "vite",
  "version": "7.1.3",
  "dist": {
    "integrity": "sha512-OOUi5zjkDxYrKhTV3V7iKsoS37VUM7v40+HuwEmcrsf11Cdx9y3DIr2Px6liIcZFwt3XSRpQvFpL3WVy7ApkGw==",
    "shasum": "8d70cb02fd6346b4bf1329a6760800538ef0faea",
    "tarball": "https://registry.npmjs.org/vite/-/vite-7.1.3.tgz",
    "fileCount": 41,
    "unpackedSize": 2262818,
    "attestations": {
      "url": "https://registry.npmjs.org/-/npm/v1/attestations/vite@7.1.3",
      "provenance": {
        "predicateType": "https://slsa.dev/provenance/v1"
      }
    },
    "signatures": [
      {
        "keyid": "SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U",
        "sig": "MEUCIQCVzzJWzguXLA+VIXXASkT6hxhd/bDbShaohIw6DspbEAIgXGO7iDWCSkHERJ2CqHTa6BVqearJrZumOzAk63rO9Zo="
      }
    ]
  },
  "_npmUser": {
    "name": "GitHub Actions",
    "email": "npm-oidc-no-reply@github.com",
    "trustedPublisher": {
      "id": "github",
      "oidcConfigId": "oidc:a2e674b1-239b-4e35-a07f-7b43debc0a8c"
    }
  }
}
```

## Resources

Refer to the npm docs for more details about [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) and [generating provenance attestations](https://docs.npmjs.com/generating-provenance-statements).

## Attribution

Inspired by [Are we PEP 740 yet?](https://trailofbits.github.io/are-we-pep740-yet/).
