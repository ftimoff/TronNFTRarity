const { JsonDB } = require('node-json-db');
const { Config } = require('node-json-db/dist/lib/JsonDBConfig');
const fs = require('fs');
const axios = require('axios');

const IconSdk = require('icon-sdk-js');
const IconService = IconSdk.default;
const provider = new IconService.HttpProvider('https://ctz.solidwallet.io/api/v3');
const iconService = new IconService(provider);

const callIconMethod = (from, to, method, params) => {
    let txObj = new IconService.IconBuilder.CallBuilder();
    if (from !== '') txObj.from(from);
    txObj.to(to).method(method).params(params);
    let call = txObj.build();
    return iconService.call(call).execute();
};

const createCollection = async (contract, fromId = 1, toId = 1) => {
    try {
        var name = await callIconMethod('', contract, 'name', {});
        console.log(`creating collection ${name}`);

        var db = new JsonDB(new Config(`./data/${name}.json`, true, true, '/'));
        db.push('/name', name, true);
        db.push('/contract', contract, true);
        db.push('/total', 0, true);
        db.push('/description', '', true);
        db.push('/image', '', true);
        if (!db.exists('/items')) db.push('/items', [], true);

        // sync tokenURI
        var isLoop = true;
        var i = fromId;
        while (isLoop) {
            var tokenURI = await callIconMethod('', contract, 'tokenURI', { _id: IconService.IconConverter.toHex(i) });
            console.log(`crawling #${i} tokenURI ${tokenURI}`);

            // not set toId
            if (toId == 1) {
                isLoop = tokenURI != undefined;
            } else {
                isLoop = (i < toId);
            }

            if (tokenURI !== undefined) {
                // try to get from craft network
                if (!tokenURI.includes('http')) tokenURI = `https://craft-network.mypinata.cloud/ipfs/${tokenURI}`;

                // get metadata
                var res = await axios.get(tokenURI);
                var nftMetadata = res.data;
                if (!nftMetadata.id) nftMetadata.id = i;

                if (db.getIndex('/items', i, 'id') == -1) db.push(`/items[]`, res.data, true);
            }
            i++;
        }

        // update total
        db.push('/total', db.count('/items'), true);
        console.log(`synced total items: ${db.count('/items')}`);
    } catch (error) {
        console.log(error.message);
    }
};

const getCollection = async (contract) => {
    try {
        var name = await callIconMethod('', contract, 'name', {});
        var db = new JsonDB(new Config(`./data/${name}.json`, true, true, '/'));
        var items = db.getData('/');

        return items;
    } catch (error) {
        console.log(error.message);
    }
};

const getCollections = (callback) => {
    let collections = [];
    fs.readdir('./data', (err, files) => {
        files.forEach((fileName) => {
            if (fileName.includes('.rarity.json')) {
                var db = new JsonDB(new Config(`./data/${fileName}`, true, true, '/'));
                if (db.exists('/meta/name')) {
                    collections.push({
                        name: db.getData(`/meta/name`),
                        description: db.getData(`/meta/description`),
                        total: db.getData(`/meta/total`),
                        contract: db.getData(`/meta/contract`),
                        image: db.getData(`/meta/image`),
                        assetType: db.exists(`/meta/assetType`) ? db.getData(`/meta/assetType`) : 'image'
                    });
                }
            }
        });
        callback(collections);
    });
};

const getTraits = (collectionName) => {
    var db = new JsonDB(new Config(`./data/${collectionName}.rarity.json`, true, true, '/'));
    var traits = db.getData(`/traits`);
    return traits;
};

const getTraitCount = (collectionName) => {
    var db = new JsonDB(new Config(`./data/${collectionName}.rarity.json`, true, true, '/'));
    var traitCount = db.getData(`/traitCount`);
    return traitCount;
};

const getNfts = (collectionName, pageIndex, pageSize, sortBy, filters) => {
    var nfts = [];

    var db = new JsonDB(new Config(`./data/${collectionName}.rarity.json`, true, true, '/'));
    var allNfts = db.getData(`/rarity`);
    var filteredNfts = allNfts.filter(function (nft) {
        return nft != null;
    });

    // filter
    if (filters && filters.length > 0) {
        filteredNfts = filteredNfts.filter(function (nft) {
            let matchedCount = 0;

            filters.forEach((filter) => {
                if (filter.ids) {
                    if (filter.ids.indexOf(nft.id) > -1) {
                        matchedCount++;
                    }
                }
                if (filter.trait_type) {
                    if (filter.trait_type == 'Trait Count') {
                        if (nft.trait_count.trait_type == parseInt(filter.value)) matchedCount++;
                    } else {
                        nft.attributes.forEach((attr) => {
                            if (attr.trait_type == filter.trait_type && attr.value == filter.value) {
                                matchedCount++;
                            }
                        });
                    }
                }
            });

            return filters.length === matchedCount;
        });
    }

    // sort
    var sortedAllNfts = filteredNfts.sort(function (a, b) {
        return sortBy == 'rarity' ? b.rarity_score - a.rarity_score : a.id - b.id;
    });

    var fromIdx = pageIndex * pageSize;
    for (var i = fromIdx; i < fromIdx + pageSize; i++) {
        if (sortedAllNfts[i]) nfts.push(sortedAllNfts[i]);
    }
    return { total: filteredNfts.length, nfts: nfts };
};

module.exports = {
    // for tool
    createCollection: createCollection,
    getCollection: getCollection,

    // for api
    getCollections: getCollections,
    getTraits: getTraits,
    getTraitCount: getTraitCount,
    getNfts: getNfts
};
