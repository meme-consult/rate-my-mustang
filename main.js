const thIndex = 8;
const rateMyProfSearchURL = "https://www.ratemyprofessors.com/search.jsp?queryBy=teacherName";
const schoolQuery = "&schoolName=university+of+western+ontario";

function getProfNames() {
  let profs = [];
  $("table td:nth-child("+ thIndex +")").each(function(){
    let cellText = $(this)[0].innerHTML;
    cellText = cellText.replace(/\n/g, ' ');
    cellText = cellText.replace(/<br>/g, ' ');

    let namesInCell = cellText.split(" ");
    if(namesInCell.length > 0) {
      for (let i = 0; i < namesInCell.length; i++) {
        let name = namesInCell[i];

        if (/\S/.test(name)) {
          const profQuery = `&query=${name}`;
          const query = `${rateMyProfSearchURL}${schoolQuery}&queryoption=HEADER${profQuery}&facetSearch=true`;
          $(this)[0].innerHTML = "<a href=" + query + ">" + cellText + "</a>";
          if($.inArray(name, profs) === -1) profs.push(name)
        }
      }
    }
  });
  return profs;
}
function cleanArray(arr) {
  temp = [];
  for (let i of arr) {
    i && temp.push(i);
  }
  arr = temp;
  delete temp;
  return arr;
}

console.log(cleanArray(getProfNames()));

