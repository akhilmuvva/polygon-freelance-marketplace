module.exports = {
    sites: [
        {
            name: 'poly-lance-zenith',
            dir: 'frontend/dist',
            buildCommand: 'npm run build',
            distDir: 'dist',
            deployment: {
                type: 'ipfs',
            },
        },
    ],
};
