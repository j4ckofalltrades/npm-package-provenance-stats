const downloadCounts = require('download-counts');
const fs = require('fs');

async function fetchPackageInfoWithRetry(packageName, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(`https://registry.npmjs.org/${packageName}`);
            if (!response.ok) {
                if (response.status >= 500 && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    console.warn(`Failed to fetch ${packageName} (attempt ${attempt}): ${response.status}. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                console.error(`Failed to fetch ${packageName}: ${response.status}`);
                return {status: 'error', package: packageName};
            }
            const data = await response.json();

            const version = data['dist-tags']?.latest;
            if (!version) {
                console.error(`No latest version found for ${packageName}`);
                return {status: 'error', package: packageName};
            }

            const versionData = data.versions?.[version];
            if (!versionData) {
                console.error(`Version data not found for ${packageName}@${version}`);
                return {status: 'error', package: packageName};
            }

            if (versionData.deprecated && versionData.deprecated.trim() !== "") {
                console.log(`Skipping deprecated package: ${packageName}`);
                return {status: 'deprecated', package: packageName};
            }

            let repositoryUrl = "";
            if (data.repository) {
                if (typeof data.repository === 'string') {
                    repositoryUrl = data.repository;
                } else if (data.repository.url) {
                    repositoryUrl = data.repository.url;
                }
            }

            return {
                status: 'success',
                data: {
                    package: packageName,
                    version: version,
                    attestationsUrl: versionData.dist?.attestations?.url || "",
                    lastUploaded: data.time?.[version] || "",
                    repositoryUrl,
                    trustedPublisher: versionData._npmUser?.trustedPublisher?.id || "",
                }
            };
        } catch (error) {
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.warn(`Error fetching ${packageName} (attempt ${attempt}): ${error.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`Error fetching ${packageName} after ${maxRetries} attempts:`, error.message);
                return {status: 'error', package: packageName};
            }
        }
    }
}

async function main() {
    const targetPackages = 500;
    const allPackageNames = Object.entries(downloadCounts)
        .sort(([_, cnt1], [__, cnt2]) => cnt2 - cnt1)
        .slice(0, 1000)
        .map(([name, _]) => name);

    console.log(`Fetching package details until we have ${targetPackages} valid packages...`);

    let validResults = [];
    let deprecatedCount = 0;
    let errorCount = 0;
    let processedCount = 0;

    while (validResults.length < targetPackages && processedCount < allPackageNames.length) {
        const remaining = targetPackages - validResults.length;
        // Take a batch, but add some extra to account for deprecated/error packages
        const batchSize = Math.min(50, Math.max(remaining, Math.floor(remaining * 1.2)), allPackageNames.length - processedCount);

        const batch = allPackageNames.slice(processedCount, processedCount + batchSize);
        console.log(`Processing batch (${batch.length} packages), need ${remaining} more valid packages...`);

        const batchPromises = batch.map(packageName => fetchPackageInfoWithRetry(packageName));
        const batchResults = await Promise.all(batchPromises);

        for (const result of batchResults) {
            if (result.status === 'deprecated') {
                deprecatedCount++;
            } else if (result.status === 'error') {
                errorCount++;
            } else if (result.status === 'success') {
                validResults.push(result.data);
            }
        }

        processedCount += batch.length;

        console.log(`Progress: ${validResults.length}/${targetPackages} valid packages collected`);
        console.log(`Total processed: ${processedCount}, Deprecated: ${deprecatedCount}, Errors: ${errorCount}`);

        if (validResults.length < targetPackages && processedCount < allPackageNames.length) {
            console.log('Waiting 100ms before next batch...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    if (validResults.length > targetPackages) {
        validResults = validResults.slice(0, targetPackages);
    }

    console.log(`Successfully collected ${validResults.length} valid packages`);
    console.log(`Total processed: ${processedCount} packages`);
    console.log(`Deprecated packages skipped: ${deprecatedCount}`);
    console.log(`Packages with errors: ${errorCount}`);

    const maxAllowableErrors = Math.floor(processedCount * 0.1);
    if (errorCount > maxAllowableErrors) {
        console.log(`Too many errors during fetching (${errorCount} > ${maxAllowableErrors}), skipping update of attestations data.`)
        return;
    }

    const dataWithTimestamp = {
        lastUpdated: new Date().toISOString(),
        packages: validResults
    };

    fs.writeFileSync('data/attestations.json', JSON.stringify(dataWithTimestamp));
    console.log('Results saved to data/attestations.json');

    const withAttestations = validResults.filter(pkg => pkg.attestationsUrl !== "").length;
    console.log(`Packages with attestations: ${withAttestations}/${validResults.length}`);
}

main().catch(console.error);
