$(document).ready(function() {

    $('input').prop('disabled', false);

    let block_size_value = NaN;
    let set_size_value = NaN;
    let mm_size_value = NaN;
    let mm_size_sel = "words";
    let cm_size_value = NaN;
    let cm_size_sel = "words";
    let block_sequence_array = NaN;
    let cache_time = 0;
    let memory_time = 0;

    // Function to debounce other functions
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Generalized debounced handler with specific logic
    const handleInput = debounce(function(event) {
        const inputId = $(event.target).attr('id');
        let inputValue = $(event.target).val();
        
        // Enforce numerical input
        inputValue = inputValue.replace(/[^0-9]/g, ''); // Remove non-numeric characters
        $(event.target).val(inputValue); // Update the input field with cleaned value
        
        if (inputId === 'cache_block_size_value') {
            block_size_value = parseInt(inputValue);
        } else if (inputId === 'set_size_value') {
            set_size_value = parseInt(inputValue);
        } else if (inputId === 'block_size_value') {
            cm_size_value = parseInt(inputValue);
        } else if (inputId === 'cache_time_value') {
            cache_time = parseInt(inputValue);
        } else if (inputId === 'memory_time_value') {
            memory_time = parseInt(inputValue);
        }

        doCalculation();
    }, 0); 

    // Handler for block sequence input
    const handleInputWithComma = debounce(function(event) {
        let inputValue = $(event.target).val();
        // Allow only numbers and commas
        inputValue = inputValue.replace(/[^0-9,]/g, ''); 
        $(event.target).val(inputValue); // Update the input field with cleaned value
        block_sequence_array = inputValue.split(',').map(value => value.trim()).filter(value => /^\d+$/.test(value)).map(Number);
        block_sequence_array.unshift(0);
        doCalculation();
    }, 0);

    // Attach the debounced handler to each input
    $("#cache_block_size_value").on("input", handleInput);
    $("#set_size_value").on("input", handleInput);
    $('#block_size_value').on("input", handleInput);
    $('#block_sequence_value').on("input", handleInputWithComma);
    $('#cache_time_value').on("input", handleInput);
    $('#memory_time_value').on("input", handleInput);

    // Additional handling to prevent invalid key presses
    $("#block_size_value, #set_size_value, #mm_memory_size_value, #cache_memory_size_value, #block_sequence_value, #memory_time_value, #cache_time_value").on("keypress", function(event) {
        const key = event.which || event.keyCode;
        // Allow numbers, commas, backspace, delete, tab, escape, and enter
        if (key >= 48 && key <= 57 || key === 44 || key === 8 || key === 9 || key === 27 || key === 13) {
            return;
        }
        event.preventDefault(); // Prevent invalid key press
    });

    $("#block_size").change(function() {
        doCalculation();
    });

    // Do calculation here
    function doCalculation() {
        console.log(block_size_value);
        console.log(set_size_value);
        console.log(block_sequence_array);
        let choice = $("#block_size").val();
        
        
        if(choice === "blocks" && set_size_value && block_size_value % set_size_value != 0 ){
            $("label[for='cache_block_size']").html("Cache blocks: - This must be divisible by set size");
        } else if( choice === "words" && set_size_value && block_size_value % (set_size_value * cm_size_value)){
            $("label[for='cache_block_size']").html("Cache blocks: - This must be divisible by set size");
        } 
        else{
            $("label[for='cache_block_size']").html("Cache blocks:");
            if (!isNaN(block_size_value) && !isNaN(set_size_value) && Array.isArray(block_sequence_array)) {
                let nRows;
                if (choice === 'blocks'){
                    nRows = block_size_value / set_size_value;
                } else{
                    nRows = block_size_value / (set_size_value*cm_size_value);
                }
                
                const nCols = set_size_value;
                let nHits = 0;
                let nMiss = 0;
                
                // Create and initialize the 2D array with NaN
                let arr = Array.from({ length: nRows }, () => Array(nCols).fill(NaN));
                // Fill ages with 0.
                let age_arr = Array.from({ length: nRows }, () => Array(nCols).fill(Number.MAX_SAFE_INTEGER));
    
                for (let i = 1; i < block_sequence_array.length; i++) {
                    let curr = block_sequence_array[i] % nRows;
    
                    let found = false;
                    for (let j = 0; j < nCols; j++) {
                        if (arr[curr][j] === block_sequence_array[i]) {
                            nHits++;
                            age_arr[curr][j] = i; // update age of where it was found to i.
                            found = true;
                            break;
                        }
                    }
    
                    if (!found) {
                        let max = age_arr[curr][0];
                        let maxIndex = 0;
    
                        for (let j = 1; j < nCols; j++) {
                            if (max < age_arr[curr][j]) {
                                max = age_arr[curr][j];
                                maxIndex = j;
                            }
                        }
    
                        // Replace this with the new one
                        arr[curr][maxIndex] = block_sequence_array[i];
                        age_arr[curr][maxIndex] = i; // update the age of the new block
                        nMiss++;
                    }
                }
    
                let arrString = '<table border="1"><tr><th>SET</th>';
                for (let j = 0; j < nCols; j++) {
                    arrString += `<th>BLOCK${j}</th>`;
                }
                arrString += '</tr>';
        
                for (let i = 0; i < nRows; i++) {
                    arrString += `<tr><td>${i}</td>`;
                    for (let j = 0; j < nCols; j++) {
                        arrString += `<td>${isNaN(arr[i][j]) ? '' : arr[i][j]}</td>`;
                    }
                    arrString += '</tr>';
                }
                arrString += '</table>';
        
                $('#array_output').html(arrString);
    
                $("label[for='hits']").html("Hits: " + nHits);
                $("label[for='miss']").html("Miss: " + nMiss);
                $("label[for='missPenalty']").html("Miss Penalty: " + 2 * (cache_time + memory_time) + " ns");
                $("label[for='averageAccessTime']").html("Average Access Time: " + (nHits / (nHits + nMiss) * cache_time + nMiss / (nHits + nMiss) * (2 * (cache_time + memory_time))) + " ns");
                $("label[for='totalAccessTime']").html("Total Access Time: " +
                    (nHits * cm_size_value * cache_time + nMiss * cm_size_value * (cache_time + memory_time) + nMiss * cache_time) + " ns");
                       
    
                    $('#getOutput').off('click').on('click', function() {
                    let textContent = "SET\t";
                    for (let j = 0; j < nCols; j++) {
                        textContent += `BLOCK${j}\t`;
                    }
                    textContent += "\n";
            
                    for (let i = 0; i < nRows; i++) {
                        textContent += `${i}\t`;
                        for (let j = 0; j < nCols; j++) {
                            textContent += `${isNaN(arr[i][j]) ? '' : arr[i][j]}\t`;
                        }
                        textContent += "\n";
                    }
            
                    textContent += "\n";
                    textContent += "Hits: " + nHits + "\n";
                    textContent += "Miss: " + nMiss + "\n";
                    textContent += "Miss Penalty: " + 2 * (cache_time + memory_time) + " ns\n";
                    textContent += "Average Access Time: " + 
                        (nHits / (nHits + nMiss) * cache_time + nMiss / (nHits + nMiss) * (2 * (cache_time + memory_time))) + " ns\n";
                    textContent += "Total Access Time: " + 
                        (nHits * cm_size_value * cache_time + nMiss * cm_size_value * (cache_time + memory_time) + nMiss * cache_time) + " ns\n";
    
                    let blob = new Blob([textContent], { type: 'text/plain' });
    
                    // Create a link element
                    let link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = "output.txt";
                    link.click();
                });
            }
        }
        
       
    }
});