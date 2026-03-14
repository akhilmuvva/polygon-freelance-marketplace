import { ParticleAuthModule } from "@biconomy/particle-auth";
for (const key in ParticleAuthModule) {
    try {
        console.log(`Key: ${key}, Type: ${typeof ParticleAuthModule[key]}`);
    } catch (e) {
        console.log(`Key: ${key}, Error accessing: ${e.message}`);
    }
}
