/*
  * https://github.com/Roblox/luau/blob/master/VM/src/lmathlib.cpp
*/

export class FakeInt
{
    value: any

    constructor()
    {
        this.value = 0n;
    }
}

const PCG32_INC = 105n;
const GLOBALSTATE = new FakeInt();

export function pcg32_random(state: any)
{
    /*
        uint64_t oldstate = *state;
        *state = oldstate * 6364136223846793005ULL + (PCG32_INC | 1);
        uint32_t xorshifted = uint32_t(((oldstate >> 18u) ^ oldstate) >> 27u);
        uint32_t rot = uint32_t(oldstate >> 59u);
        return (xorshifted >> rot) | (xorshifted << ((-int32_t(rot)) & 31));
    */
    
    let oldstate = new FakeInt();
    oldstate.value = BigInt.asUintN(64, state.value);

    state.value = oldstate.value * 6364136223846793005n + BigInt.asUintN(64, PCG32_INC | 1n);

    let xorshifted = BigInt.asUintN(32, ((oldstate.value >> 18n) ^ oldstate.value) >> 27n);
    let rot = BigInt.asUintN(32, oldstate.value >> 59n);

    return BigInt.asUintN(32, (xorshifted >> rot) | (xorshifted << ((-BigInt.asIntN(32, rot)) & 31n)));
}

export function pcg32_seed(state: any, seed: any)
{
    /*
        *state = 0;
        pcg32_random(state);
        *state += seed;
        pcg32_random(state);
    */

    state.value = 0n;
    pcg32_random(state);
    state.value += BigInt.asUintN(64, seed);
    pcg32_random(state);
}

export function math_random(l: any, u: any, state: any)
{
    /*
        int l = luaL_checkinteger(L, 1);
        int u = luaL_checkinteger(L, 2);
        luaL_argcheck(L, l <= u, 2, "interval is empty");

        uint32_t ul = uint32_t(u) - uint32_t(l);
        luaL_argcheck(L, ul < UINT_MAX, 2, "interval is too large"); // -INT_MIN..INT_MAX interval can result in integer overflow
        uint64_t x = uint64_t(ul + 1) * pcg32_random(&g->rngstate);
        int r = int(l + (x >> 32));
        lua_pushinteger(L, r); // int between `l' and `u'
    */

    u = BigInt(u);
    l = BigInt(l);

    let ul = BigInt.asUintN(32, u) - BigInt.asUintN(32, l);
    
    let x = BigInt.asUintN(64, ul + 1n) * pcg32_random(state ? state : GLOBALSTATE);
    let r = Number(l + (x >> 32n));

    return r;
}

export class Random {
    Seed: any
    State: any

    constructor(Seed: any) {
        this.Seed = Seed;

        this.State = new FakeInt();
        pcg32_seed(this.State, this.Seed);
    }

    randomseed(seed: any) {
        pcg32_seed(this.State, seed);
    }

    random(l: any, u: any) {
        return math_random(l, u, this.State);
    }
}
