onmessage = function(e) {

    console.log(e)

    let conceptsArray = [];

    for (let i = 0; i < e.data['response'].length; i++) {
        let output = e.data['response'][i];
        let imageUrl = output['input']['data']['image']['url'];

        if (e.data['model']['givesConcepts']) {
            if (Object.keys(output['data']).length === 0 && output['data'].constructor === Object) {
                conceptsArray.push({
                    url: imageUrl,
                    concept: null,
                    confidence: null
                });
            } else {
                for (let j = 0; j < output['data']['concepts'].length; j++) {
                    let concept = output['data']['concepts'][j]['name'];
                    let confidence = output['data']['concepts'][j]['value'];

                    if (+confidence >= 0.1) {
                        conceptsArray.push({
                            url: imageUrl,
                            concept: concept,
                            confidence: +confidence
                        });
                    }
                }
            }

        } else {

            switch (e.data['model']['name']) {
                case 'Celebrity':
                    if (Object.keys(output['data']).length === 0 && output['data'].constructor === Object) {
                        conceptsArray.push({
                            url: imageUrl,
                            celebrity: 'No celebrity present',
                            bbox: null,
                            confidence: null
                        });
                    } else {
                        for (let j = 0; j < output['data']['regions'].length; j++) {
                            let regions = output['data']['regions'][j];
                            let bbox = regions['region_info']['bounding_box'];

                            for (let k = 0; k < regions['data']['face']['identity']['concepts'].length; k++) {
                                let celebrity = regions['data']['face']['identity']['concepts'][k]['name'];
                                let confidence = regions['data']['face']['identity']['concepts'][k]['value'];

                                if (+confidence >= 0.1) {
                                    conceptsArray.push({
                                        url: imageUrl,
                                        celebrity: celebrity,
                                        bbox: bbox,
                                        confidence: +confidence
                                    });
                                }
                            }
                        }
                    }
                    break;

                case 'Color':
                    for (let j = 0; j < output['data']['colors'].length; j++) {
                        let color = output['data']['colors'][j]['raw_hex'];
                        let density = output['data']['colors'][j]['value'];
                        let colorName = output['data']['colors'][j]['w3c']['name'];

                        conceptsArray.push({
                            url: imageUrl,
                            name: colorName,
                            hex: color,
                            density: +density
                        });
                    }
                    break;

                case 'Demographics':
                    if (Object.keys(output['data']).length === 0 && output['data'].constructor === Object) {
                        conceptsArray.push({
                            url: imageUrl,
                            age: null,
                            gender: null,
                            multicultural: null,
                            bbox: null,
                        });
                    } else {
                        for (let j = 0; j < output['data']['regions'].length; j++) {
                            let faces = output['data']['regions'][j];
                            let bbox = faces['region_info']['bounding_box'];
                            let age = 0;
                            let gender = '';
                            let multicultural = '';
                            let mean = 0;
                            let factors = 0;

                            for (let k = 0; k < faces['data']['face']['age_appearance']['concepts'].length; k++) {
                                let newAge = +faces['data']['face']['age_appearance']['concepts'][k]['name'];
                                let factor = +faces['data']['face']['age_appearance']['concepts'][k]['value'];
                                mean += (newAge * factor);
                                factors += factor;
                            }

                            // for (let k = 0; k < faces['data']['face']['gender_appearance']['concepts'].length; k++) {
                            //     let confidence = faces['data']['face']['gender_appearance']['concepts'][k]['value'];
                            //     if (+confidence >= 0.1) {
                            //         let newGender = faces['data']['face']['gender_appearance']['concepts'][k]['name'].concat(' - ', confidence);
                            //         if (gender.length > 0) {
                            //             gender = gender.concat('|', newGender);
                            //         } else {
                            //             gender = newGender;
                            //         }
                            //     }
                            // }
                            gender = faces['data']['face']['gender_appearance']['concepts'][0]['name'];

                            // for (let k = 0; k < faces['data']['face']['multicultural_appearance']['concepts'].length; k++) {
                            //     let confidence = faces['data']['face']['multicultural_appearance']['concepts'][k]['value'];
                            //     if (+confidence >= 0.1) {
                            //         let newCulture = faces['data']['face']['multicultural_appearance']['concepts'][k]['name'].concat(' - ', confidence);
                            //         if (multicultural.length > 0) {
                            //             multicultural = multicultural.concat('|', newCulture);
                            //         } else {
                            //             multicultural = newCulture;
                            //         }
                            //     }
                            // }
                            multicultural = faces['data']['face']['multicultural_appearance']['concepts'][0]['name'];

                            age = Math.round(mean / factors);

                            conceptsArray.push({
                                url: imageUrl,
                                age: age,
                                gender: gender,
                                multicultural: multicultural,
                                bbox_bottom: bbox.bottom_row,
                                bbox_left: bbox.left_col,
                                bbox_right: bbox.right_col,
                                bbox_top: bbox.top_row,
                                bbox_x: bbox.right_col - bbox.left_col,
                                bbox_y: bbox.bottom_row - bbox.top_row
                            });
                        }
                    }
                    break;

                case 'Face Detection':
                    if (Object.keys(output['data']).length === 0 && output['data'].constructor === Object) {
                        conceptsArray.push({
                            url: imageUrl,
                            bbox: null
                        });
                    } else {
                        for (let j = 0; j < output['data']['regions'].length; j++) {
                            let regions = output['data']['regions'][j];
                            let bbox = regions['region_info']['bounding_box'];

                            conceptsArray.push({
                                url: imageUrl,
                                bbox: bbox
                            });
                        }
                    }
                    break;
            }
        }
    }

    postMessage(conceptsArray);

}
