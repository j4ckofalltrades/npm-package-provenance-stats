const downloadCounts = require('download-counts');
const fs = require('fs');

async function fetchPackageInfo(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!response.ok) {
      console.error(`Failed to fetch ${packageName}: ${response.status}`);
      return null;
    }
    const data = await response.json();

    return {
      package: packageName,
      version: data.version,
      attestations_url: data.dist?.attestations?.url || ""
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
  console.log('Fetching top 500 packages...');
  const topPackageNames = Object.entries(downloadCounts)
    .sort(([_, cnt1], [__, cnt2]) => cnt2 - cnt1)
    .slice(0, 500)
    .map(([name, _]) => name);
  
  console.log(`Processing ${topPackageNames.length} packages in batches of 50...`);
  const results = await processBatch(topPackageNames);
  const validResults = results.filter(result => result !== null);
  
  console.log(`Successfully processed ${validResults.length} packages`);
  
  fs.writeFileSync('data/attestations.json', JSON.stringify(validResults));
  console.log('Results saved to data/attestations.json');
  
  const withAttestations = validResults.filter(pkg => pkg.attestations_url !== "").length;
  console.log(`Packages with attestations: ${withAttestations}/${validResults.length}`);
}

main().catch(console.error);
