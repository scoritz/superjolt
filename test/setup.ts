// Mock chalk globally
jest.mock('chalk', () => {
  const chainableMock: any = (str: string) => str;

  const props = [
    'bold',
    'dim',
    'italic',
    'underline',
    'inverse',
    'hidden',
    'strikethrough',
    'visible',
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'grey',
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
    'bgGray',
    'bgGrey',
    'reset',
    'blackBright',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
    'whiteBright',
  ];

  props.forEach((prop) => {
    chainableMock[prop] = chainableMock;
  });

  chainableMock.supportsColor = false;
  chainableMock.level = 0;

  return chainableMock;
});
