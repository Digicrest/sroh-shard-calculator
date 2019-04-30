function setup() {
    units.forEach(function (unit) {
        unit.rating = 0;
        unit.comment = "";
    })
    units = units.filter(unit => !unit.name.includes('generic') && unit.category !== "Villain")
}
setup();

let vue_app = new Vue({
    el: '#app',
    data: {
        all_units: units,
        unit_index: Math.floor(Math.random() * units.length),
        filters: {
            search: "",
            role: "",
            rarity: "",
            element: ""
        },
        already_awakened: false,
        will_awaken: false,
        evolution: {
            current: 1,
            desired: 6
        },
        upgrades: {
            current: 0,
            desired: 5
        },
        cost: {
            shards: 0,
            gold: 0,
            elixirs: {
                small: 0,
                medium: 0,
                large: 0
            },
            ores: {
                small: 0,
                medium: 0,
                large: 0
            }
        },
        showOutput: false,
        showError: false,
        errormessage: ""
    },
    computed: {
        unit: function () {
            return this.all_units[this.unit_index]
        },
        unit_list: function () {
            return this.all_units
                .filter(unit => unit.name.toLowerCase().includes(this.filters.search.toLowerCase()))
                .filter(unit => this.filters.role ? unit.role.toLowerCase() == this.filters.role.toLowerCase() : unit)
                .filter(unit => this.filters.element ? unit.element.toLowerCase() == this.filters.element.replace(/\s+/g, '').toLowerCase() : unit)
                .filter(unit => this.filters.rarity ? unit.unlock_stars === this.filters.rarity.length : unit)
                .filter(unit => unit.category !== "Villain")
        }
    },
    methods: {
        selectUnit: function (name) {
            this.unit_index = this.all_units.map(unit => unit.name).indexOf(name);  
        },
        calculate: function() {
            let validInput = this.checkValidInput();
            this.showOutput = validInput;

            if (this.unit.category == "Villain") {
                this.will_awaken = false;
                this.already_awakened = false;
            }

            if (validInput) {
                let data = upgradeCosts["nat_" + this.unit.unlock_stars].slice(this.evolution.current - 1, this.evolution.desired).slice();
                
                let totals = [];

                data.forEach(star => {
                    if((star.current_star === this.evolution.current) && (star.current_star == this.evolution.desired)) {
                        totals.push(this.getSum(star.costs.upgrade.slice(this.upgrades.current, this.upgrades.desired), { gold: 0, shards: 0}))
                    } else if (star.current_star === this.evolution.current) {
                        totals.push(this.getSum(star.costs.upgrade.slice(this.upgrades.current), star.costs.evolution))
                    } else if(star.current_star == this.evolution.desired) {
                        totals.push(this.getSum(star.costs.upgrade.slice(0, this.upgrades.desired), { gold: 0, shards: 0}));
                    } else {
                        totals.push(this.getSum(star.costs.upgrade, star.costs.evolution));
                    }
                });

                let calculation = this.getSum(totals, { gold: 0, shards: 0 });

                Object.keys(calculation).forEach(key => {
                    this.cost[key] = calculation[key];
                });

                if (this.will_awaken) {
                    this.cost.shards += 300;


                    let awaken_info = awaken_costs[this.unit.unlock_stars - 1];
                    this.cost.gold += awaken_info.gold;
                    Object.keys(awaken_info.ores).forEach(key => {
                        this.cost.ores[key] += awaken_info.ores[key];
                    });
                }
            } else {
                this.showError = true;
            }
        },
        getSum(costs, evolution_cost) {
            let total_shards = costs.map(c => c.shards).reduce((acc, i) => acc += i, 0);
            let total_gold = costs.map(c => c.gold).reduce((acc, i) => acc += i, 0);
            let total_elixirs = costs.map(c => c.elixirs).reduce(this.object_reducer, { small: 0, medium: 0, large: 0});
            let total_ores = costs.map(c => c.ores).reduce(this.object_reducer, { small: 0, medium: 0, large: 0});
            
            return {
                gold: total_gold + evolution_cost.gold, 
                shards: total_shards + evolution_cost.shards,
                elixirs: total_elixirs,
                ores: total_ores
            }
        },
        object_reducer: function(obj, c) {
            obj.small += c.small;
            obj.medium += c.medium;
            obj.large += c.large;
            return obj;
        },
        checkValidInput: function() {
            if (this.evolution.current < this.unit.unlock_stars) {
                this.errormessage = "Cannot start at an evolution below natural rarity.";
                return false;
            }
            
            if (this.evolution.desired < this.evolution.current) {
                this.errormessage = 'Cannot "un-evolve".'
                return false;
            }

            if (this.evolution.current == this.evolution.desired && this.upgrades.desired < this.upgrades.current) {
                this.errormessage ="Cannot lose upgrades.";
                return false;
            }

            return true;
        }
    },
    watch: {
        all_units: function() {
            console.log("hey")
        },
        already_awakened: function() {
            if (this.already_awakened) {
                this.will_awaken = false;
            }
        },
        will_awaken: function() {
            if(this.will_awaken) {
                this.already_awakened = false;
            }
        }
    }
})