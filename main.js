//TODO: Handle multiple profNames per cell

// The index of the "Professor" column on the UWO Timetable website (http://studentservices.uwo.ca/secure/timetables/mastertt/ttindex.cfm)
const profIndex = 8;
const rateMyProfSearchURL = "https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=university+of+western+ontario";
let profRatings = {};

function main() {
  try {
    addButtonsToTimetable();
  } catch (err) {
    console.log(err)
  }
};

function addButtonsToTimetable(){
  $("table td:nth-child("+ profIndex +")").each(function(){
    let cell = $(this)[0];
    const profName = cell.innerText.replace(/ /g,  '');
    if(isNotBlank(profName)) {
      cell.appendChild(createButton(profName, cell));
    }
  });
}

function createButton(profName, cell) {
  const profQuery = `&query=${profName}`
  let button =  document.createElement('span');
  button.query = `${rateMyProfSearchURL}&queryoption=HEADER${profQuery}&facetSearch=true`;
  button.clicked = false;
  button.cell = cell;
  button.addEventListener('click', function() {
    const that = this;
    toggleRatingDisplay(that, profName, cell);
  });
  $(button).addClass('chevron down-chevron');
  return button;
};

function toggleRatingDisplay(button, profName, cell){
  if (button.clicked) {
    hideRating(button);
  } else {
    fetchRating(button, cell, profName);
  }
};

function hideRating(button) {
  button.clicked = false;
  let ratingDiv = button.parentElement.getElementsByClassName('rating')[0];
  $(ratingDiv).addClass('hidden');
  const errorMessage = button.parentElement.getElementsByClassName('error')[0];
  if (errorMessage) button.parentElement.removeChild(errorMessage);
  $(button).addClass('down-chevron');
}

function fetchRating(button, cell, profName) {
  button.clicked = true;
  const rating = profRatings[profName];

  if (rating) {
    showRating(button, cell, rating);
  } else {
    const loader = createLoaderOn(cell);
    const profSearchURL = button.query;

    retrieveRatingFromRMP(profSearchURL, cell).then( function(ratingDiv) {
      cell.removeChild(loader);
      if(!ratingDiv) throw `Couldn't find ${profName}.`;
      profRatings[profName] = ratingDiv;
      showRating(button, cell, ratingDiv);
    }).catch( function(err) {
      $(button).removeClass('down-chevron');
      createErrorMessage(err, cell, profSearchURL);
    });

  }
}

function showRating(button, cell, ratingDiv) {
  $(button).removeClass('down-chevron');

  const rating = getRatingDiv(cell);
  if (rating) {
    $(rating).removeClass('hidden');
  } else {
    $(ratingDiv).removeClass('hidden');
    const clone = ratingDiv.cloneNode(true);
    cell.appendChild(clone);
  }
}

function getRatingDiv(cell) {
  return $(cell).find('.rating')[0];
}

function createLoaderOn(cell) {
  let loader = document.createElement('div');
  $(loader).addClass('loader');
  cell.appendChild(loader);
  return loader;
}

function retrieveRatingFromRMP(profSearchQuery, cell) {
  let profRatingURL;

  return ajax(profSearchQuery).then( function(profSearchPage) {
    profRatingURL = getProfRatingURL(profSearchPage);
    return ajax(profRatingURL);
  }).then( function(response) {
    const profData = {
      url: profRatingURL,
      quality: $(response).find('.quality .grade')[0].innerText,
      difficulty: $(response).find('.difficulty .grade')[0].innerText.trim(),
      numRatings: $(response).find('.rating-count')
    };
    return createRatingDiv(profData, cell);
  }).catch( function(err) {
    console.log(err);
  });
};

function getProfRatingURL(response) {
    const firstSearchResult = $(response).find('.PROFESSOR a')[0];
    const profIdQuery = $(firstSearchResult).attr('href');
    const profRatingURL = `http://ratemyprofessors.com${profIdQuery}`
    return profRatingURL;
};

function createRatingDiv(profData, element) {
  const {url, quality, difficulty, numRatings} = profData;
  let ratingDiv= document.createElement('div');
  $(ratingDiv).addClass('rating');
  const linkToRMP = createRmpLink(url);

  let qualityHeader = document.createElement('span');
  qualityHeader.innerText = "Quality";
  $(qualityHeader).addClass('rating-header');

  let difficultyHeader = document.createElement('span');
  difficultyHeader.innerText = "Difficulty";
  $(difficultyHeader).addClass('rating-header');

  let ratingsCount = document.createElement('span');
  ratingDiv.appendChild(ratingsCount);

  ratingDiv.appendChild(qualityHeader);
  ratingDiv.appendChild(ratingBar(quality));

  ratingDiv.appendChild(difficultyHeader);
  ratingDiv.appendChild(ratingBar(difficulty));

  ratingDiv.appendChild(linkToRMP);
  return ratingDiv;
};


function ratingBar(ratingString){
  let ratingPercent = parseFloat(ratingString);
      ratingPercent *= 20;
  let container = document.createElement('div');
    $(container).addClass("w3-grey w3-round rating-container");
  let bar = document.createElement('div');
    $(bar).addClass('w3-container w3-center w3-round rating-bar');
    $(bar).css('width', `${ratingPercent}%`);
    bar.innerText = ratingString;
  container.appendChild(bar);
  return container;
}

function createRmpLink(url) {
  let link = document.createElement('a');
    $(link).addClass('rmp-link');
    link.href = url;
    link.innerText = 'RateMyProf';
    link.target = "_blank";
  return link;
}


function createErrorMessage(message, cell, searchURL) {
  const err = document.createElement('a');
    err.href = searchURL;
    err.innerText = message;
    err.target = '_blank';
    $(err).addClass('error');
  cell.appendChild(err);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isNotBlank(str) {
    return !(!str || /^\s*$/.test(str));
}

function ajax(url) {
  return new Promise(function(resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(this.responseText);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.send();
  });
}

main();
