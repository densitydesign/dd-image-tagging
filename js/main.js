let $inputAPI = document.getElementById('API-key');
let $button = document.getElementById('input__button');
let $select = document.getElementById('model-select');
let $dropzone = document.getElementById('input__csv');
let $dropzoneText = document.getElementById('dropzone-text');
let $downloadSection = document.getElementById('output__links');

let inputData;
let apiCheck = $inputAPI.value != '';
let inputCheck = false;
let fileName;

let finalData = new Array;

let modelsData = {
    "aaa03c23b3724a16a56b629203edc62c": {
        name: "General",
        desc: "The ‘General’ model recognizes over 11,000 different concepts including objects, themes, moods, and more.",
        givesConcepts: true
    },
    "e0be3b9d6a454f0493ac3a30784001ff": {
        name: "Apparel",
        desc: "The ‘Apparel’ model recognizes more than 100 fashion-related concepts including clothing and accessories.",
        givesConcepts: true
    },
    "e466caa0619f444ab97497640cefc4dc": {
        name: "Celebrity",
        desc: "The ‘Celebrity’ model analyzes images and returns probability scores on the likelihood that the media contains the face(s) of over 10,000 recognized celebrities.",
        givesConcepts: false
    },
    "eeed0b6733a644cea07cf4c60f87ebb7": {
        name: "Color",
        desc: "The ‘Color’ model returns density values for dominant colors present in images. Color predictions are returned in hex format.",
        givesConcepts: false
    },
    "c0c0ac362b03416da06ab3fa36fb58e3": {
        name: "Demographics",
        desc: "The ‘Demographics’ model analyzes images and returns information on age, gender, and multicultural appearance for each detected face based on facial characteristics.",
        givesConcepts: false
    },
    "a403429f2ddf4b49b307e318f00e528b": {
        name: "Face Detection",
        desc: "The ‘Face Detection’ model returns probability scores on the likelihood that the image contains human faces and coordinate locations of where those faces appear with a bounding box.",
        givesConcepts: false
    },
    "bd367be194cf45149e75f01d59f77ba7": {
        name: "Food",
        desc: "The ‘Food’ model recognizes more than 1,000 food items in images down to the ingredient level.",
        givesConcepts: true
    },
    "d16f390eb32cad478c7ae150069bd2c6": {
        name: "Moderation",
        desc: "This model returns probability scores on the likelihood that an image contains concepts such as gore, drugs, explicit nudity, or suggestive nudity. It also returns the probability that the image is “safe,” meaning it does not contain the aforementioned four moderation categories.",
        givesConcepts: true
    },
    "e9576d86d2004ed1a38ba0cf39ecb4b1": {
        name: "NSFW",
        desc: "The ‘NSFW’ (Not Safe For Work) model returns probability scores on the likelihood that an image contains nudity.",
        givesConcepts: true
    },
    "fbefb47f9fdb410e8ce14f24f54b47ff": {
        name: "Textures and Patterns",
        desc: "The Textures and Patterns model is designed to acquire and apply knowledge for recognizing textures/patterns in a two-dimensional image. It includes common textures (feathers, woodgrain), unique/fresh concepts (petrified wood, glacial ice), and overarching descriptive concepts (veined, metallic).",
        givesConcepts: true
    },
    "eee28c313d69466f836ab83287a54ed9": {
        name: "Travel",
        desc: "The ‘Travel’ model recognizes specific features of residential, hotel, and travel-related properties.",
        givesConcepts: true
    }
};

function predict(data, model, api, index, chunksRemaining) {
    const app = new Clarifai.App({
        apiKey: api
    });

    if (window.Worker) {
        let csvBuilder = new Worker('./js/csv-worker.js');

        app.models.initModel({
            id: model
        })
        .then(chosenModel => {
            return chosenModel.predict(data);
        })
        .catch(error => {
            console.log(error);
            $button.innerText = "Something went wrong, check console.";
        })
        .then(response => {
            console.log("Clarifai response: ", response.status);
            csvBuilder.postMessage({response: response['outputs'], model: modelsData[model]});

            csvBuilder.onmessage = function(e) {
                finalData = finalData.concat(e.data);

                if (chunksRemaining > 0) {
                    predict(inputData[index + 1], model, api, index + 1, chunksRemaining - 1);
                } else {
                    let headers = Object.keys(finalData[0]);
                    let newCsv = d3.csvFormat(finalData, headers);
                    let modelId = $select.selectedOptions[0].value;
                    let model = modelsData[modelId].name.toLowerCase().replace(/\s/g, '_');
                    let newFileName = fileName.replace('.csv', '_concepts_' + model + '.csv');

                    let link = document.createElement('a');
                    link.classList.add('output__link');
                    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(newCsv));
                    link.setAttribute('download', newFileName);
                    link.innerText = newFileName;
                    $downloadSection.appendChild(link);

                    $button.innerText = "Done! Ready to process another"
                    // console.log(finalData);
                }
            }

            csvBuilder.onerror = function(e) {
                console.log(e);
            }
        })
        .catch(error => {
            console.log(error);
            $button.innerText = "Something went wrong, check console.";
        });
    }
}

function updateModelDesc(id) {
    let $modelTitle = document.getElementById('description__model');
    let $modelText = document.getElementById('description__text');
    let newModel = modelsData[id];

    $modelTitle.innerText = newModel.name;
    $modelText.innerText = newModel.desc + " A 'null' value in every field means either that the algorithm couldn't anything in the image or it could not load the image.";
}

function checkDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    if (event.type == "dragenter") {
        $dropzone.classList.add("drop-hover");
        $dropzoneText.innerText = "Drop it and I'll catch it!";
        let secondaryText = document.getElementById('dropzone-wrong');
        if (secondaryText != null) {
            $dropzone.removeChild(secondaryText);
        }

    } else {
        $dropzone.classList.remove("drop-hover");
        $dropzoneText.innerText = "Drag & drop a .csv file here";
    }

}

function doDrop(event) {
    event.stopPropagation();
    event.preventDefault();

    let dt = event.dataTransfer;
    let file = dt.files[0];
    fileName = file.name;

    if (file.type == "text/csv") {

        if (window.Worker) {
            var parser = new Worker('./js/parser-worker.js');

            parser.postMessage(file);

            parser.onmessage = function(e) {
                $dropzone.classList.remove("drop-hover");
                $dropzoneText.innerText = 'has been loaded and parsed';
                $dropzoneText.insertAdjacentHTML('afterbegin', '<span>' + fileName + '</span><br/>');
                $dropzoneText.insertAdjacentHTML('afterend', '<p id="dropzone-wrong">Wrong .csv? Throw me another one!</p>');
                $button.classList.remove("process-going");
                $button.innerText = "Process input file";
                // console.log(e.data);
                inputData = e.data;

                if (apiCheck) {
                    $button.classList.add("process-ready");
                }
                inputCheck = true;
            }

            parser.onerror = function(e) {
                console.log(e);
            }
        }

    } else {
        $dropzoneText.innerText = "This is not a csv!"
    }

    finalData = [];
}

$inputAPI.addEventListener('input', function(event){
    let apiId = event.currentTarget.value;
    if (apiId != '') {
        if (inputCheck) {
            $button.classList.add("process-ready");
        }
        apiCheck = true;
    } else {
        apiCheck = false;
        $button.classList.remove("process-ready");
    }
    finalData = [];
});

$select.addEventListener('change', function(event){
    let modelId = event.currentTarget.selectedOptions[0].value;

    updateModelDesc(modelId);
    finalData = [];
});

$dropzone.addEventListener('dragover', function(event){
    event.stopPropagation();
    event.preventDefault();
});

$dropzone.addEventListener('dragenter', function(event){
    checkDrop(event);
});

$dropzone.addEventListener('dragleave', function(event){
    checkDrop(event);
});

$dropzone.addEventListener('drop', function(event){
    doDrop(event);
});

$button.addEventListener('click', function(event){
    let processReady = event.currentTarget.classList.contains('process-ready');

    if (processReady) {
        event.currentTarget.innerText = "Processing input";
        event.currentTarget.insertAdjacentHTML('beforeend', '<span>•</span><span>•</span><span>•</span>');
        event.currentTarget.classList.add("process-going");

        let apiId = $inputAPI.value;
        let modelId = $select.selectedOptions[0].value;

        predict(inputData[0], modelId, apiId, 0, inputData.length - 1);
    }
});

updateModelDesc($select.selectedOptions[0].value);
