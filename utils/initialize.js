'use server'

const fetchDefaultSelectedMap = async () => {
    let urlParams = '?selectedMap=newest'
    const selectedMapResponse = await fetch(process.env.HOST_BASE_URL_DEV + '/api/map' + urlParams);
    const selectedMapData = await selectedMapResponse.json();

    console.log('selectedMapData', selectedMapData);
    return selectedMapData[0];
}

export default fetchDefaultSelectedMap;

