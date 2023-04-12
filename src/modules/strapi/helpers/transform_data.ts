const footerData = (response) => {
  return response.data.data[0].attributes
};

const headerSlider = (response) => {
  let resData = response.data.data;
  resData.sort(function(a, b) { 
    return ( a.attributes.list_priority - b.attributes.list_priority );
  });
  return resData;
};

const homeSection2 = (response) => {
  let resData = response.data.data[0].attributes;
  return resData;
};

const questsItems = (response) => {
  let resData = response.data.data;
  resData.sort(function(a, b) { 
    return ( a.attributes.list_priority - b.attributes.list_priority );
  });
  return resData;
};

const tournamentsLists = (response) => {
  let resData = response.data.data;
  resData.sort(function(a, b) { 
    return ( a.attributes.list_priority - b.attributes.list_priority );
  });
  return resData;
};

const gameLists = (response) => {
  let resData = response.data.data;
  resData.sort(function(a, b) { 
    return ( a.attributes.list_priority - b.attributes.list_priority );
  });
  return resData;
};

const mediaLists = (response) => {
  let resData = response.data.data;
  resData.sort(function(a, b) { 
    return ( a.attributes.list_priority - b.attributes.list_priority );
  });
  return resData;
};

const wikiListsId = (response) => {
  let resData = response.data.data;
  return resData;
};

const quest = (response) => {
  let resData = response.data.data;
  return resData;
};

const articleDetails = (response) => {
  let resData = response.data.data;
  return resData;
};

const videoDetails = (response) => {
  let resData = response.data.data;
  return resData;
};

const meta = (response) => {
  let resData = response.data.data;
  return resData;
};






export {
  footerData, 
  headerSlider,
  homeSection2,
  questsItems,
  tournamentsLists,
  gameLists,
  mediaLists,
  wikiListsId,
  quest,
  articleDetails,
  videoDetails,
  meta
};
