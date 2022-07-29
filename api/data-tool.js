const nftData = require('./nft-data');
const nftAnalyzer = require('./nft-analyzer');

var argv = require('minimist')(process.argv.slice(2));
var cmd = argv._[0];
if (cmd == 'create') {
    if (!argv.contract || typeof argv.contract !== 'string') {
        console.error('invalid contract');
    } else {
        var fromId = argv.fromId > 1 ? argv.fromId : 1;
        var toId = argv.toId > 1 ? argv.toId : 1;
        nftData.createCollection(argv.contract, fromId, toId);
    }
}

if (cmd == 'analyze') {
    if (!argv.contract || typeof argv.contract !== 'string') {
        console.error('invalid contract');
    } else {
        nftData.getCollection(argv.contract).then((collection) => {
            // correct fields for consistency
            collection.items.forEach(async (item) => {
                if (!item.image.includes('http') && item.image_url.includes('http')) {
                    item.image = item.image_url;
                }
                item.attributes.forEach((attr) => {
                    attr.trait_type = attr.key || attr.name;
                });
            });

            nftAnalyzer.analyze(collection);
        });
    }
}

//// collections
// GangstaBet       cx384018e03aa8b739472c7a0645b70df97550e2c2    5555
// Krazy Cats       cxb5ec6bfa92134b8d4883c16d340e8ad541ed79ff    249
// Picxals on ICON  cx7fc67030a7eb46aa176a15267b600d48e11ef44b    428
// Winible | Cuvée  cxedc23d58aec29d37a9b8f36ae0901f90726479fe    975
// Cubies           cx8e51beac285e664d74d457bb8fbbbb693bf1b97d    18

//// commands
// node data-tool.js create --contract --fromId --toId
// node data-tool.js analyze --contract 
