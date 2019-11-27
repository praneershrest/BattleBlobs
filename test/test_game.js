var chai = require('chai')
    , expect = chai.expect
    , assert = chai.assert
    , should = chai.should();

var game = require('../game').app;
var request = require('supertest');

//set up data to pass to login method
const userCredentials = {
    username: 'mojo123',
    password: '12345'
}

//login user
var authenticatedUser = request.agent(game);

describe('login', ()=>{
    it("user can log in", (done)=>{
        authenticatedUser
            .post('/login')
            .send(userCredentials)
            .end((err,res)=>{
                expect(res.statusCode).to.equal(200);
                expect('Location', '/admin');
                done();
            });
    });
});


var req = require('request'),
    base_url = "http://localhost:5000";

describe('server access', () =>{
    describe("GET /", ()=>{
        it("returns status code 200", (done)=>{
            req.get(base_url,(err,res,body)=>{
                assert.equal(200, res.statusCode);
                done();
            });
        });
    });
});

var players = require('../game.js').players;
var playerCount = require('../game.js').playerCount;
describe('players', ()=>{
    it('object', ()=>{
        expect(players).to.be.an('object');
    });
});

describe('player count', ()=>{
    it('player count is same as players length',()=>{
        assert.equal(Object.keys(players).length, playerCount);
    });
});
