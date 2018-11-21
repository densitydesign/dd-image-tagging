importScripts('https://d3js.org/d3-dsv.v1.min.js');

onmessage = function(e) {

    // let workerResult;
    // let workerError;

    let reader = new FileReader();
    reader.onload = function(event) {
        let data = d3.csvParse(event.target.result, function(d, i, a) {
            let colName = a[0];
            return d[colName];
        });

        let splitData = [];
        let index = 0;
        while (index < data.length) {
            splitData.push(data.slice(index, 128 + index));
            index += 128;
        }

        postMessage(splitData);
    };
    reader.readAsText(e.data);
}
