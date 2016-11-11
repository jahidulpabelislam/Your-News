/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
    the License. A copy of the License is located at http://aws.amazon.com/apache2.0/ or in the "license" file
    accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
    either express or implied. See the License for the specific language governing permissions and limitations
    under the License.
*/

"use strict";

var AWS = require("aws-sdk");

var database = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The Teams class stores all teams states for the user
     */
    function Teams(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                teams: []
            };
        }
        this._session = session;
    }

    Teams.prototype = {
        save: function (callback) {
            //save the teams states in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentTeams = this.data;
            dynamodb.putItem({
                TableName: 'YourNewsUserTeams',
                Item: {
                    UserID: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadTeams: function (session, callback) {
            if (session.attributes.currentTeams) {
                console.log('get teams from session=' + session.attributes.currentTeams);
                callback(new Teams(session, session.attributes.currentTeams));
                return;
            }
            dynamodb.getItem({
                TableName: 'YourNewsUserTeams',
                Key: {
                    UserID: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentTeams;
                if (err) {
                    console.log(err, err.stack);
                    currentTeams = new Teams(session);
                    session.attributes.currentTeams = currentTeams.data;
                    callback(currentTeams);
                } else if (data.Item === undefined) {
                    currentTeams = new Teams(session);
                    session.attributes.currentTeams = currentTeams.data;
                    callback(currentTeams);
                } else {
                    console.log("get teams from dynamodb=" + data.Item.Data.S);
                    currentTeams = new Teams(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentTeams = currentTeams.data;
                    callback(currentTeams);
                }
            });
        }
    };
})();
module.exports = database;
