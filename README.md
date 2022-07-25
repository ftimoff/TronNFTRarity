# ICON Nft Rarity
Tron Nft Rarity is the tool to find out how rare an NFT is. 

## Features
- Built on [Tron blockchain](https://trondao.org)
- Listing ranking collections on Ape NFT. 
- Filtering NFTs by traits
- Sorting NFTs by Rank and ID
- NFTs data analysis: create collection data by crawling NFT metadata, analyze NFTs rarity score (Rarity Score is based on [the article](https://raritytools.medium.com/ranking-rarity-understanding-rarity-calculation-methods-86ceaeb9b98c))



### Screenshots

<img src="https://user-images.githubusercontent.com/44108463/150624586-365b637c-7a11-4c26-b5d2-9009f39e2212.png" width="800"/>




## Getting Started
1. Install node modules
2. Init collection data
- Create collection raw data in `data` folder
    ```
    cd api
    node data-tool.js create --contract <collection-contract-address>
    ```
    params: `--fromId` `--toId` is optional
- Analyze to transform collection raw data to rarity data in `data` folder
    ```
    cd api
    node data-tool.js analyze --contract <collection-contract-address>
    ```
3. Start API server side 
    ```
    cd api
    npm start
    ```

4. Start App client side
    ```
    cd app
    npm start
    ```
    



