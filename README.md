# npm package provenance stats

This site shows which of the top 500 most-downloaded packages on [npm](https://npmjs.com) have been uploaded with attestations.

The list of most-downloaded packages (by monthly download counts) are extracted from the [download-counts](https://npmjs.com/package/download-counts) package.

The attestation details for the latest version of each package is fetched from `registry.npmjs.org/<package>/latest` endpoint.
If a package was uploaded with attestations, the attestations url is set in the `dist.attestations.url` field.

Data is updated every fortnightly. 

Inspired by [Are we PEP 740 yet?](https://trailofbits.github.io/are-we-pep740-yet/).
