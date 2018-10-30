/*
        *File: DockerSandbox.js
        *Author: Osman Ali Mian/Asad Memon
        *Created: 3rd June 2014
        *Revised on: 25th June 2014 (Added folder mount permission and changed executing user to nobody using -u argument)
        *Revised on: 30th June 2014 (Changed the way errors are logged on console, added language name into error messages)
*/


/**
         * @Constructor
         * @variable DockerSandbox
         * @description This constructor stores all the arguments needed to prepare and execute a Docker Sandbox
         * @param {Number} timeout_value: The Time_out limit for code execution in Docker
         * @param {String} path: The current working directory where the current API folder is kept
         * @param {String} folder: The name of the folder that would be mounted/shared with Docker container, this will be concatenated with path
         * @param {String} vm_name: The TAG of the Docker VM that we wish to execute
         * @param {String} compiler_name: The compiler/interpretor to use for carrying out the translation
         * @param {String} file_name: The file_name to which source code will be written
         * @param {String} code: The actual code
         * @param {String} output_command: Used in case of compilers only, to execute the object code, send " " in case of interpretors
*/
var DockerSandbox = function(timeout_value, path, folder, vm_name
        , compiler_name, file_name, output_command, languageName, e_arguments
        , stdin_data, code, codefile, root_path_code_user)
{

    this.timeout_value=timeout_value;
    this.path=path;
    this.folder=folder;
    this.vm_name=vm_name;
    this.compiler_name=compiler_name;
    this.file_name=file_name;
    this.code = code;
    this.codefile = codefile;
    this.output_command=output_command;
    this.langName=languageName;
    this.extra_arguments=e_arguments;
    this.stdin_data=stdin_data;
    this.root_path_code_user = root_path_code_user;
}


/**
         * @function
         * @name DockerSandbox.run
         * @description Function that first prepares the Docker environment and then executes the Docker sandbox 
         * @param {Function pointer} success ?????
*/
DockerSandbox.prototype.run = function(success, node_path) 
{
    var sandbox = this;

    this.prepare( function(){
        sandbox.execute(success, node_path);
    });
}


/*
         * @function
         * @name DockerSandbox.prepare
         * @description Function that creates a directory with the folder name already provided through constructor
         * and then copies contents of folder named Payload to the created folder, this newly created folder will be mounted
         * on the Docker Container. A file with the name specified in file_name variable of this class is created and all the
         * code written in 'code' variable of this class is copied into this file.
         * Summary: This function produces a folder that contains the source file and 2 scripts, this folder is mounted to our
         * Docker container when we run it.
         * @param {Function pointer} success ?????
*/
DockerSandbox.prototype.prepare = function(success)
{
    var exec = require('child_process').exec;
    var fs = require('fs');
    var sandbox = this;

    exec("mkdir "+ this.path+this.folder + " && cp "+this.path+"/Payload/* "+this.path+this.folder+"&& chmod 777 "+ this.path+this.folder, function(st)
        {
            if (sandbox.codefile) {
                // copy file code to folder to run build
                exec("cp -a \'" + sandbox.root_path_code_user + sandbox.codefile + "\' \'"+sandbox.path+sandbox.folder+"/"+sandbox.file_name+"\'", function(err) {
                    if (err) 
                    {
                        console.log('===========================Copy code to build folder', err);
                    }    
                    else
                    {
                        console.log(sandbox.langName + " file was copied!");
                        // chmod 777 for code file
                        exec("chmod 777 \'"+sandbox.path+sandbox.folder+"/"+sandbox.file_name+"\'");
            
                        fs.writeFile(sandbox.path + sandbox.folder+"/inputFile", sandbox.stdin_data, function(err) 
                        {
                            if (err) 
                            {
                                console.log(err);
                            }    
                            else
                            {
                                console.log("Input file was saved!");
                                success();
                            } 
                        });
                    }
                });
            }
            else {
                fs.writeFile(sandbox.path + sandbox.folder+"/" + sandbox.file_name, sandbox.code, function(err) 
                {
                    if (err) 
                    {
                        console.log(err);
                    }    
                    else
                    {
                        console.log(sandbox.langName+" file was saved!");
                        exec("chmod 777 \'"+sandbox.path+sandbox.folder+"/"+sandbox.file_name+"\'")
    
                        fs.writeFile(sandbox.path + sandbox.folder+"/inputFile", sandbox.stdin_data,function(err) 
                        {
                            if (err) 
                            {
                                console.log(err);
                            }    
                            else
                            {
                                console.log("Input file was saved!");
                                success();
                            } 
                        });
                    } 
                });
            }
        });

}

/*
         * @function
         * @name DockerSandbox.execute
         * @precondition: DockerSandbox.prepare() has successfully completed
         * @description: This function takes the newly created folder prepared by DockerSandbox.prepare() and spawns a Docker container
         * with the folder mounted inside the container with the name '/usercode/' and calls the script.sh file present in that folder
         * to carry out the compilation. The Sandbox is spawned ASYNCHRONOUSLY and is supervised for a timeout limit specified in timeout_limit
         * variable in this class. This function keeps checking for the file "Completed" until the file is created by script.sh or the timeout occurs
         * In case of timeout an error message is returned back, otherwise the contents of the file (which could be the program output or log of 
         * compilation error) is returned. In the end the function deletes the temporary folder and exits
         * 
         * Summary: Run the Docker container and execute script.sh inside it. Return the output generated and delete the mounted folder
         *
         * @param {Function pointer} success ?????
*/

DockerSandbox.prototype.replaceFriendly = function(data) {
    if (data == "") {
        return data;
    }
    // console.log('=================Output before====', data);
    var regex = /(in+\s)\/usercode\/file\.([a-zA-Z]*)/gi;
    var friendly = data.replace(regex, '');
    // console.log('=================Output after====', friendly);
    return friendly;
}

DockerSandbox.prototype.execute = function(success, node_path)
{
    var exec = require('child_process').exec;
    var fs = require('fs');
    var myC = 0; //variable to enforce the timeout_value
    var timeTick = 1000/1;// = 50ms ~ 0.05s
    var timeMax = this.timeout_value * 1000;
    var sandbox = this;
    
    node_path = node_path || '/usr/local/lib/node_modules';
    //this statement is what is executed
    var st = this.path+'DockerTimeout.sh ' + this.timeout_value + 's -u mysql -e \'NODE_PATH=' + node_path + '\' -i -t -v  "' + this.path + this.folder + '":/usercode ' + this.vm_name + ' /usercode/script.sh ' + this.compiler_name + ' ' + this.file_name + ' ' + this.output_command+ ' ' + this.extra_arguments;
    
    //log the statement in console
    console.log(st);

    //execute the Docker, This is done ASYNCHRONOUSLY
    exec(st, function(err, data){
        console.log("================Docker run finished=======", err);
    });
    
    console.log("------------------------------")
    //Check For File named "completed" after every 1 second
    var intid = setInterval(function() 
        {
            //Displaying the checking message after 1 second interval, testing purposes only
            //console.log("Checking " + sandbox.path+sandbox.folder + ": for completion: " + myC);
            console.log('==================retry read result', myC);
            myC = myC + timeTick;
			
            fs.readFile(sandbox.path + sandbox.folder + '/completed', 'utf8', function(err, data) {
            
            //if file is not available yet and the file interval is not yet up carry on
            if (err && myC < timeMax) 
            {
                //console.log(err);
                return;
            } 
            //if file is found simply display a message and proceed
            else if (myC < timeMax) 
            {
                console.log("DONE")
                //check for possible errors
                fs.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8', function(err2, data2) 
                {
                	if(!data2) {
                        data2 = "";
                    }
                    else {
                        data2 = sandbox.replaceFriendly(data2);
                    }

               		console.log("Error file: ")
               		console.log(data2);

               		console.log("Main File")
               		console.log(data);

                    var lines = data.toString().split('*-COMPILEBOX::ENDOFOUTPUT-*');
                    data = lines[0];
                    
                    var time = lines[1].replace(' ', '');
                    if (time.indexOf('.') == 0) {
                        time = '0' + time;
                    }

                    console.log("Time: ");
                    console.log(time);

       	           	success(data, time, data2);
                });

                //return the data to the calling functoin
            	
            } 
            //if time is up. Save an error message to the data variable
            else 
            {
                console.log("Timed Out: "+sandbox.folder+" "+sandbox.langName);
                var isGetDataWhenExceed = false;
                
                if (!isGetDataWhenExceed) {
                    // return error timeout when exceed 
                    success("Execution Timed Out", sandbox.timeout_value , "Compile time is greater " + sandbox.timeout_value + 's');
                }
                else {
                    //Since the time is up, we take the partial output and return it.
                    fs.readFile(sandbox.path + sandbox.folder + '/logfile.txt', 'utf8', function(err, data){
                        console.log('=================data here', data);
                        if (!data) {
                            data = "";
                        }

                        data += "\nExecution Timed Out";
                        
                        fs.readFile(sandbox.path + sandbox.folder + '/errors', 'utf8', function(err2, data2) 
                        {
                            if(!data2) {
                                data2 = "";
                            }
                            else {
                                data2 = sandbox.replaceFriendly(data2);
                            }

                            var lines = data.toString().split('*---*');
                            data = lines[0];

                            var time = lines[1].replace(' ', '');
                            if (time.indexOf('.') == 0) {
                                time = '0' + time;
                            }

                            console.log("Time: ");
                            console.log(time);


                            success(data, time, data2);
                        });
                    });
                }
            }

            //now remove the temporary directory
            exec("rm -r " + sandbox.folder, function(err){
                console.log("ATTEMPTING TO REMOVE: " + sandbox.folder);
                console.log("------------------------------");
            });

            
            clearInterval(intid);
        });
    }, timeTick);

}


module.exports = DockerSandbox;
