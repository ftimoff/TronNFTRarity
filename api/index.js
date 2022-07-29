const nftData = require('./nft-data');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.send('NFT Rarity app running...');
});

app.get('/collections', (req, res) => {
    nftData.getCollections((collections) => {
        res.send(collections);
    });
});

app.get('/traits', (req, res) => {
    var collection = req.query.collection;
    var allTraits = nftData.getTraits(collection);
    res.send(allTraits);
});

app.get('/traitCount', (req, res) => {
    var collection = req.query.collection;
    var traitCount = nftData.getTraitCount(collection);
    res.send(traitCount);
});

app.post('/nfts', function (req, res) {
    var collection = req.body.collection;
    var id = parseInt(req.body.id);

    if (id > 0) {
        var nft = nftData.getNftById(collection, id);
        res.send([nft]);
    } else {
        var pageSize = parseInt(req.body.pageSize);
        var pageIndex = parseInt(req.body.pageIndex);
        var filters = req.body.filters;
        var sortBy = req.body.sortBy;
        var nfts = nftData.getNfts(collection, pageIndex, pageSize, sortBy, filters);
        res.send(nfts);
    }
});

app.listen(port, () => {
    console.log(`NFT Rarity app listening at http://localhost:${port}`);
});
