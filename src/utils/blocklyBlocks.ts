import * as Blockly from 'blockly';

// Define custom blocks for trading bot
export const defineCustomBlocks = () => {
  // Trade Parameters Block (Global Reference)
  Blockly.Blocks['trade_parameters'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("⚙️ Trade Parameters");
      this.appendDummyInput()
        .appendField("Market")
        .appendField(new Blockly.FieldDropdown([
          ["Volatility 10 (1s) Index", "1HZ10V"],
          ["Volatility 25 (1s) Index", "1HZ25V"],
          ["Volatility 50 (1s) Index", "1HZ50V"],
          ["Volatility 75 (1s) Index", "1HZ75V"],
          ["Volatility 100 (1s) Index", "1HZ100V"],
          ["Volatility 10 Index", "R_10"],
          ["Volatility 25 Index", "R_25"],
          ["Volatility 50 Index", "R_50"],
          ["Volatility 75 Index", "R_75"],
          ["Volatility 100 Index", "R_100"]
        ]), "MARKET");
      this.appendDummyInput()
        .appendField("Contract Type")
        .appendField(new Blockly.FieldDropdown([
          ["Matches", "DIGITMAT"],
          ["Differs", "DIGITDIFF"],
          ["Over", "DIGITOVER"],
          ["Under", "DIGITUNDER"],
          ["Even", "DIGITEVEN"],
          ["Odd", "DIGITODD"]
        ]), "CONTRACT_TYPE");
      this.appendDummyInput()
        .appendField("Stake")
        .appendField(new Blockly.FieldNumber(0.35, 0.35), "STAKE");
      this.appendDummyInput()
        .appendField("Duration (ticks)")
        .appendField(new Blockly.FieldNumber(1, 1, 10), "DURATION");
      this.appendDummyInput()
        .appendField("Prediction")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]), "PREDICTION");
      this.appendDummyInput()
        .appendField("Take Profit")
        .appendField(new Blockly.FieldNumber(10, 0), "TAKE_PROFIT");
      this.appendDummyInput()
        .appendField("Stop Loss")
        .appendField(new Blockly.FieldNumber(10, 0), "STOP_LOSS");
      this.setNextStatement(true, null);
      this.setColour(230);
      this.setTooltip("Global trade parameters");
    }
  };

  // Purchase Conditions Block
  Blockly.Blocks['purchase_conditions'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("🛒 Purchase Conditions");
      this.appendDummyInput()
        .appendField("Buy Immediately")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "IMMEDIATE");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Trigger purchase");
    }
  };

  // Sell Conditions Block (Optional)
  Blockly.Blocks['sell_conditions'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("💰 Sell Conditions");
      this.appendDummyInput()
        .appendField("Early Sell")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "ENABLED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(120);
      this.setTooltip("Optional: Sell conditions");
    }
  };

  // Restart Conditions Block (Optional)
  Blockly.Blocks['restart_conditions'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("🔄 Restart Conditions");
      this.appendDummyInput()
        .appendField("Restart After")
        .appendField(new Blockly.FieldDropdown([
          ["Win", "win"],
          ["Loss", "loss"],
          ["Both", "both"]
        ]), "CONDITION");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Optional: Restart conditions");
    }
  };

  // Martingale (Simple Multiplier)
  Blockly.Blocks['martingale'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("📈 Martingale");
      this.appendDummyInput()
        .appendField("Multiplier")
        .appendField(new Blockly.FieldNumber(2, 1, 10), "MULTIPLIER");
      this.appendDummyInput()
        .appendField("Enabled")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "ENABLED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(330);
      this.setTooltip("Martingale stake management");
    }
  };

  // Purchase Block - Matches
  Blockly.Blocks['purchase_matches'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase MATCHES");
      this.appendDummyInput()
        .appendField("Digit")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]), "DIGIT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy a MATCHES contract");
    }
  };

  // Purchase Block - Differs
  Blockly.Blocks['purchase_differs'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase DIFFERS");
      this.appendDummyInput()
        .appendField("Digit")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]), "DIGIT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy a DIFFERS contract");
    }
  };

  // Purchase Block - Over
  Blockly.Blocks['purchase_over'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase OVER");
      this.appendDummyInput()
        .appendField("Digit")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"]
        ]), "DIGIT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy an OVER contract");
    }
  };

  // Purchase Block - Under
  Blockly.Blocks['purchase_under'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase UNDER");
      this.appendDummyInput()
        .appendField("Digit")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]), "DIGIT");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy an UNDER contract");
    }
  };

  // Purchase Block - Even
  Blockly.Blocks['purchase_even'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase EVEN");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy an EVEN contract");
    }
  };

  // Purchase Block - Odd
  Blockly.Blocks['purchase_odd'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Purchase ODD");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(160);
      this.setTooltip("Buy an ODD contract");
    }
  };

  // Trade on Every Tick
  Blockly.Blocks['trade_on_tick'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Trade on Every Tick")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "ENABLED");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(290);
      this.setTooltip("Enable trading on every tick");
    }
  };
};

// Toolbox configuration
export const getToolbox = () => ({
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '1. Trade Parameters',
      colour: '230',
      contents: [
        { kind: 'block', type: 'trade_parameters' }
      ]
    },
    {
      kind: 'category',
      name: '2. Purchase Conditions',
      colour: '160',
      contents: [
        { kind: 'block', type: 'purchase_conditions' },
        { kind: 'block', type: 'purchase_matches' },
        { kind: 'block', type: 'purchase_differs' },
        { kind: 'block', type: 'purchase_over' },
        { kind: 'block', type: 'purchase_under' },
        { kind: 'block', type: 'purchase_even' },
        { kind: 'block', type: 'purchase_odd' }
      ]
    },
    {
      kind: 'category',
      name: '3. Sell Conditions',
      colour: '120',
      contents: [
        { kind: 'block', type: 'sell_conditions' }
      ]
    },
    {
      kind: 'category',
      name: '4. Restart Conditions',
      colour: '290',
      contents: [
        { kind: 'block', type: 'restart_conditions' },
        { kind: 'block', type: 'trade_on_tick' }
      ]
    },
    {
      kind: 'category',
      name: '5. Stake Management',
      colour: '330',
      contents: [
        { kind: 'block', type: 'martingale' }
      ]
    },
    {
      kind: 'category',
      name: '6. Logic',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_boolean' }
      ]
    },
    {
      kind: 'category',
      name: '7. Math',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' }
      ]
    },
    {
      kind: 'category',
      name: '8. Variables',
      colour: '330',
      custom: 'VARIABLE'
    }
  ]
});

// Default workspace XML
export const getDefaultWorkspace = () => `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="trade_parameters" x="100" y="50">
    <next>
      <block type="purchase_conditions">
        <next>
          <block type="sell_conditions">
            <next>
              <block type="restart_conditions">
                <next>
                  <block type="martingale"></block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>
`;
