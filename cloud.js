var AV = require('leanengine');
var _ = require('lodash');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function (request, response) {
    response.success('Hello world!');
});


AV.Cloud.defune('deleteUser', function (request, response) {
    // 1.删除Post中 creator==user的纪录，每条Post删除参考services.js中的removePost函数;
    // 2.删除Comment中creator＝＝user的纪录；
    // 3.删除ActivityComment中creator＝＝user的纪录；
    // 4.删除TeamComment中creator＝＝user的纪录；
    // 5.删除_Status中source＝＝user的纪录；
    // 6.删除IntroduceCard中所有creator＝＝user的纪录；
    // 7.将该user从所属Team的includeemployees中删除；
    // 8.删除_User中的该用户；

    var empid = request.params.empid;
    // 1:
    var postQuery = new AV.Query("Post");
    postQuery.equalTo('creatorInfo', empid);
    var t1 = postQuery.find().then(function (posts) {
        var ts = [];
        _.forEach(posts, function (p) {
            // remove likes
            var likesQ = AV.Relation.reverseQuery('_User', 'likes', p);
            var tLike = likesQ.find().then(function (us) {
                var saves = [];
                _.each(us, function (u) {
                    u.relation('likes').remove(p);
                    saves.push(u.save());
                });
                return AV.Promise.all(saves);
            }, function (err) {
                console.log("delete post likes error:" + JSON.stringify(err));
                return AV.Promise.error(err);
                //  response.error(err);
            });

            // remove comments
            var commentQ = new AV.Query("Comment");
            commentQ.equalTo("post", p);
            var tComm = commentQ.destroyAll();
            // remove images
            var tImgs = [];
            _.each(p.attributes.photos, function (photo) {
                if (!photo) {
                    return;
                }
                tImgs.push(photo.destroy().then(function () {
                        return AV.Promise.as();
                    }, function (err) {
                        console.log("delete post img error:" + JSON.stringify(err));
                        return AV.Promise.error(err);
                    }
                ));
            });


            var tDes = p.destroy().then(function () {
                return AV.Promise.as();
            }, function (err) {
                console.log("delete post error:" + JSON.stringify(err));
                return AV.Promise.error(err);
            });

            ts.push(tLike);
            ts.push(tComm);
            ts.push(tImgs);
            ts.push(tDes);
        });
        ts = _.flatten(ts);
        return AV.Promise.when(ts);
    }, function (err) {
        console.log("delete post fail:" + JSON.stringify(err));
        response.error(err);
    });

    // 2
    var commentQuery = new AV.Query("Comment");
    commentQuery.equalTo("creator", empid);
    var t2 = commentQuery.destroyAll().then(function () {
        return AV.Promise.as();
    }, function (err) {
        console.log("delete user comments error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    // 3
    var acQuery = new AV.Query("ActivityComment");
    acQuery.equalTo("creator", empid);
    var t3 = acQuery.destroyAll().then(function () {
        return AV.Promise.as();
    }, function (err) {
        console.log("delete user ActivityComment error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    // 4
    var tcQuery = new AV.Query("TeamComment");
    tcQuery.equalTo("creator", empid);
    var t4 = tcQuery.destroyAll().then(function () {
        return AV.Promise.as();
    }, function (err) {
        console.log("delete user TeamComment error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    // 5
    var sQuery = new AV.Query("_Status");
    sQuery.equalTo("source", empid);
    var t5 = sQuery.destroyAll().then(function () {
        return AV.Promise.as();
    }, function (err) {
        console.log("delete user _Status error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    // 6
    var icQuery = new AV.Query("IntroduceCard");
    icQuery.equalTo("creator", empid);
    var t6 = icQuery.destroyAll().then(function () {
        return AV.Promise.as();
    }, function (err) {
        console.log("delete user IntroduceCard error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    // 7
    var teamQuery = new AV.Query("Team");
    teamQuery.equalTo("includedemployees", empid);
    var t7 = teamQuery.find().then(function (teams) {
        var saves = [];
        _.forEach(teams, function (team) {
            var ies = team.get('includedemployees');
            var newIes = _.remove(ies, function (u) {
                return u.id === empid;
            });
            team.set('includedemployees', newIes);
            saves.push(team.save());
        });
        return AV.Promise.when(saves);
    }, function (err) {
        console.log("update user team error:" + JSON.stringify(err));
        return AV.Promise.error(err);
    });

    var query = new AV.Query(employeeclass);
    var t8 = query.get(empid, {
        success: function (employee) {
            var _user = employee.attributes.user;
            return employee.destroy(function (delemployee) {
                    // 8
                    return _user.destroy().then(function () {
                        return AV.Promise.as();
                    }, function (err) {
                        console.log("delete _User error:" + JSON.stringify(err));
                        return AV.Promise.error(err);
                    })
                },
                function (delemployee, delerror) {
                    console.log("delete userInfo error:" + JSON.stringify(delerror));
                    return AV.Promise.error(delerror);
                });

        },
        error: function (employee, objerror) {
            console.log("delete fail:" + JSON.stringify(objerror));
            return AV.Promise.error(objerror);
        }
    });

    AV.Promise.when([t1, t2, t3, t4, t5, t6, t7, t8]).then(function () {
        response.success('done');
    }, function (err) {
        response.error(err);
    })
});


module.exports = AV.Cloud;
