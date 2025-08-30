const downloadCounts = require('download-counts');
const fs = require('fs');

async function fetchPackageInfo(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      console.error(`Failed to fetch ${packageName}: ${response.status}`);
      return null;
    }
    const data = await response.json();

    const version = data['dist-tags']?.latest;
    if (!version) {
      console.error(`No latest version found for ${packageName}`);
      return null;
    }

    const versionData = data.versions?.[version];
    if (!versionData) {
      console.error(`Version data not found for ${packageName}@${version}`);
      return null;
    }

    const lastUploaded = data.time?.[version] || "";
    
    // Handle repository field - can be either a string URL or an object with url property
    let repositoryUrl = "";
    if (data.repository) {
      if (typeof data.repository === 'string') {
        repositoryUrl = data.repository;
      } else if (data.repository.url) {
        repositoryUrl = data.repository.url;
      }
    }

    return {
      package: packageName,
      version: version,
      attestationsUrl: versionData.dist?.attestations?.url || "",
      lastUploaded,
      repositoryUrl
    };
  } catch (error) {
    console.error(`Error fetching ${packageName}:`, error.message);
    return null;
  }
}

async function processBatch(packages, batchSize = 50) {
  const results = [];
  
  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(packages.length / batchSize)} (${batch.length} packages)`);
    
    const batchPromises = batch.map(packageName => fetchPackageInfo(packageName));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

async function main() {
  const numPackages = 500;

  console.log(`Fetching top ${numPackages} packages...`);
  const topPackageNames = Object.entries(downloadCounts)
    .sort(([_, cnt1], [__, cnt2]) => cnt2 - cnt1)
    .slice(0, numPackages)
    .map(([name, _]) => name);
  
  console.log(`Processing ${topPackageNames.length} packages in batches of 50...`);
  const results = await processBatch(topPackageNames);
  const validResults = results.filter(result => result !== null);

  console.log(`Successfully processed ${validResults.length} packages`);
  if (validResults.length < numPackages) {
      console.log("There were errors during fetching, skipping update of attestations data.")
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
