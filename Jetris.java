import java.awt.*;
import java.awt.event.*;
import java.awt.geom.*;
import javax.swing.*;
import javax.swing.text.*;
import javax.swing.event.*;
import java.util.Random;
import java.applet.*;
import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeEvent;
import java.util.prefs.Preferences;

public class Jetris extends JPanel implements ActionListener, KeyListener, Runnable{
    //This would be #defined if #define was a java thing
    public class KeyEnum{
	public static final int left = 0;
	public static final int right = 1;
	public static final int ccrot = 2;
	public static final int rgrot = 3;
	public static final int down = 4;
	public static final int drop = 5;
    }

    class AccelbyEnum{
	public static final int lines = 0;
	public static final int drops = 1;
	public static final int score = 2;
    }



    //This should be in another file, but it isn't.  Bite me.
    class Square{
	byte state;
	byte shape;
	public Square(){
	    state = 0;
	    shape = 0;
	}
	public int getState(){
	    return (int) state;
	}
	public int getShape(){
	    return (int) shape;
	}
	public void setState(int newState){
	    state = (byte) newState;
	}
	public void setShape(int newShape){
	    shape = (byte) newShape;
	}
	public void setTo(Square square){
	    state = (byte) square.getState();
	    shape = (byte) square.getShape();
	}
    }
    // This concludes the Square class
    // This also should be in another file, but it also isn't.  Also, bite me.
    class PrefSel extends JPanel implements ActionListener{
	// This should blah blah...
	class KeySelButton extends JRadioButton implements KeyListener{
	    int index;
	    PrefSel prefSel;
	    public KeySelButton(int theIndex, String name, PrefSel thePrefSel){
		super(name);
		index = theIndex;
		prefSel = thePrefSel;
		addKeyListener(this);
	    }
	    public void keyPressed(KeyEvent e){
		prefSel.setKey(index, e.getKeyCode());
	    }
	    public void keyReleased(KeyEvent e){
	    }
	    public void keyTyped(KeyEvent e){
	    }
	}
	//Thus concluding the KeySelButton class.  How difficult was that?
	//Yawn...
	class NumberChecker implements FocusListener{
	    JTextField theTextField;
	    double min = -Double.MAX_VALUE, max = Double.MAX_VALUE;
	    double value;
	    NumberChecker(){
	    }
	    NumberChecker(double theMin, double theMax){
		min = theMin;
		max = theMax;
	    }
	    NumberChecker(JTextField tf){
		setTextField(tf);
	    }
	    NumberChecker(JTextField tf, double theMin, double theMax){
		min = theMin;
		max = theMax;
		setTextField(tf);
	    }
	    public void focusGained(FocusEvent e){
	    }
	    public void focusLost(FocusEvent e){
		check();
	    }
	    public void setTextField(JTextField tf){
		theTextField = tf;
		tf.addFocusListener(this);
		value = Double.parseDouble(tf.getText());
	    }
	    public void check(){
		System.out.println("min="+String.valueOf(min));
		System.out.println("max="+String.valueOf(max));
		try{
		    double d = Double.parseDouble(theTextField.getText());
		    if(d <= max)
			if(d >= min)
			    value = d;
		} catch(NumberFormatException e){
		}
		    theTextField.setText(String.valueOf(value));
	    } 
	    public double getValue(){
		return value;
	    }
	}
	//end numberformatter

	int[] keys;
	double baseDropTime, xBase;
	int accelby;
	boolean grid;
	Color nextPieceDisplayColor;
	Jetris jetris;
	JFrame jframe;

	//These are out here so the ActionListener can see them
	NumberChecker baseDropTimeChecker;
	NumberChecker xBaseChecker;

	public PrefSel(int[] theKeys, double theBaseDropTime, double theXBase, int theAccelby, boolean isGrid, boolean isVisibleGrid, boolean isLargeScreen, boolean isForgiving, boolean isJumpingTetrominoes, Color theNextPieceDisplayColor, Jetris theJetris, JFrame theJframe) {
	    super();

	    keys = theKeys;
	    baseDropTime = theBaseDropTime;
	    xBase = theXBase;
	    accelby = theAccelby;
	    grid = isGrid;
	    visibleGrid=isVisibleGrid;
	    largeScreen=isLargeScreen;
	    forgiving = isForgiving;
	    jumpingTetrominoes = isJumpingTetrominoes;
	    nextPieceDisplayColor = theNextPieceDisplayColor;
	    jetris = theJetris;
	    jframe = theJframe;

	    KeySelButton leftButton = new KeySelButton(KeyEnum.left, "Left", this);
      	    KeySelButton rightButton = new KeySelButton(KeyEnum.right, "Right", this);
	    KeySelButton downButton = new KeySelButton(KeyEnum.down, "Down", this);
	    KeySelButton dropButton = new KeySelButton(KeyEnum.drop, "Drop", this);
	    KeySelButton ccrotButton = new KeySelButton(KeyEnum.ccrot, "Counterclockwise", this);
	    KeySelButton rgrotButton = new KeySelButton(KeyEnum.rgrot, "Retrograde", this);
	    ButtonGroup keyButtons = new ButtonGroup();
	    keyButtons.add(leftButton);
	    keyButtons.add(rightButton);
	    keyButtons.add(downButton);
	    keyButtons.add(dropButton);
	    keyButtons.add(ccrotButton);
	    keyButtons.add(rgrotButton);

	    JTextField baseDropTimeField = new JTextField();
	    JTextField xBaseField = new JTextField();
	    baseDropTimeField.setText(String.valueOf(baseDropTime));
	    xBaseField.setText(String.valueOf(xBase));
	    baseDropTimeField.setColumns(5);
	    xBaseField.setColumns(5);
	    baseDropTimeChecker = new NumberChecker(baseDropTimeField, 0d, Double.MAX_VALUE);
	    xBaseChecker = new NumberChecker(xBaseField);


	    JRadioButton linesButton = new JRadioButton("Lines", accelby==AccelbyEnum.lines?true:false);
	    JRadioButton dropsButton = new JRadioButton("Drops", accelby==AccelbyEnum.drops?true:false);
	    JRadioButton scoreButton = new JRadioButton("Score", accelby==AccelbyEnum.score?true:false);
	    linesButton.setActionCommand("lines");
	    dropsButton.setActionCommand("drops");
	    scoreButton.setActionCommand("score");
	    linesButton.addActionListener(this);
	    dropsButton.addActionListener(this);
	    scoreButton.addActionListener(this);
	    ButtonGroup accelbyButtons = new ButtonGroup();
	    accelbyButtons.add(linesButton);
	    accelbyButtons.add(dropsButton);
	    accelbyButtons.add(scoreButton);

	    JCheckBox forgivingBox = new JCheckBox("Forgiving", forgiving);
	    forgivingBox.setActionCommand("forgiving");
	    forgivingBox.addActionListener(this);
	    JCheckBox jumpingTetrominoesBox = new JCheckBox("Jumping Tetrominoes", jumpingTetrominoes);
	    jumpingTetrominoesBox.setActionCommand("jumpingTetrominoes");
	    jumpingTetrominoesBox.addActionListener(this);


	    JCheckBox gridBox = new JCheckBox("Use grid", grid);
	    gridBox.setActionCommand("grid");
	    gridBox.addActionListener(this);
	    JCheckBox visibleGridBox = new JCheckBox("Brighten grid", visibleGrid);
	    visibleGridBox.setActionCommand("visibleGrid");
	    visibleGridBox.addActionListener(this);
	    JButton nextPieceDisplayColorButton = new JButton("Select Next Piece Display Color");
	    nextPieceDisplayColorButton.setActionCommand("nextPieceDisplayColor");
	    nextPieceDisplayColorButton.addActionListener(this);

	    JButton cancelButton = new JButton("Cancel");
	    JButton useButton = new JButton("Use");
	    JButton saveButton = new JButton("Save");
	    cancelButton.setVerticalTextPosition(AbstractButton.BOTTOM);
	    useButton.setVerticalTextPosition(AbstractButton.BOTTOM);
	    saveButton.setVerticalTextPosition(AbstractButton.BOTTOM);
	    cancelButton.setHorizontalTextPosition(AbstractButton.CENTER);
	    useButton.setHorizontalTextPosition(AbstractButton.CENTER);
	    saveButton.setHorizontalTextPosition(AbstractButton.CENTER);
	    cancelButton.setActionCommand("cancel");
	    useButton.setActionCommand("use");
	    saveButton.setActionCommand("save");
	    cancelButton.addActionListener(this);
	    useButton.addActionListener(this);
	    saveButton.addActionListener(this);

	    //Layout
	    setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));

	    JLabel label = new JLabel("Click on a radio button and press a key to override the defaults.  You can't set q, p, =, or s.");
	    label.setAlignmentX(Component.CENTER_ALIGNMENT);
	    add(label);

	    JPanel keyPanel = new JPanel();
	    keyPanel.add(leftButton);
	    keyPanel.add(rightButton);
	    keyPanel.add(downButton);
	    keyPanel.add(dropButton);
	    keyPanel.add(ccrotButton);
	    keyPanel.add(rgrotButton);
	    keyPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
	    add(keyPanel);

	    JPanel fieldPanel = new JPanel();
	    fieldPanel.add(new JLabel("Base drop time (x20ms):"));
	    fieldPanel.add(baseDropTimeField);
	    fieldPanel.add(new JLabel("Acceleration:"));
	    fieldPanel.add(xBaseField);
	    add(fieldPanel);

	    JPanel accelbyPanel = new JPanel();
	    accelbyPanel.add(new JLabel("Accelerate by:"));
	    accelbyPanel.add(linesButton);
	    accelbyPanel.add(dropsButton);
	    accelbyPanel.add(scoreButton);
	    add(accelbyPanel);

	    JPanel gameAttributesPanel = new JPanel();
	    gameAttributesPanel.add(new JLabel("Game Attributes:"));
	    gameAttributesPanel.add(forgivingBox);
	    gameAttributesPanel.add(jumpingTetrominoesBox);
	    gameAttributesPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
	    add(gameAttributesPanel);

	    JPanel uiPanel = new JPanel();
	    uiPanel.add(new JLabel("UI Attributes:"));
	    uiPanel.add(gridBox);
	    uiPanel.add(visibleGridBox);
	    uiPanel.add(nextPieceDisplayColorButton);
	    uiPanel.setAlignmentX(Component.CENTER_ALIGNMENT);
	    add(uiPanel);

	    JPanel buttonPanel = new JPanel();
	    buttonPanel.add(cancelButton);
	    buttonPanel.add(useButton);
	    buttonPanel.add(saveButton);
	    add(buttonPanel);
	}
	public void setKey(int keysi, int key){
	    keys[keysi]=key;
	}
	public void actionPerformed(ActionEvent e){
	    String ac = e.getActionCommand();
	    if(ac.equals("lines"))
		accelby = AccelbyEnum.lines;
	    else if(ac.equals("drops"))
		accelby = AccelbyEnum.drops;
	    else if(ac.equals("score"))
		accelby = AccelbyEnum.score;
	    else if(ac.equals("grid"))
		grid = !grid;
	    else if(ac.equals("visibleGrid"))
		visibleGrid = !visibleGrid;
	    else if(ac.equals("largeScreen"))
		largeScreen = !largeScreen;
	    else if(ac.equals("forgiving"))
		forgiving = !forgiving;
	    else if(ac.equals("jumpingTetrominoes"))
		jumpingTetrominoes = !jumpingTetrominoes;
	    else if(ac.equals("nextPieceDisplayColor")){
		Color foo = nextPieceDisplayColor;
		try{
		    foo = JColorChooser.showDialog(this, "Next Piece Display Color", nextPieceDisplayColor);
		} catch(HeadlessException never_gonna_happen_java_sucks){
		    // to not be filled in later, fuck checked exceptions
		}
		if(foo != null)
		    nextPieceDisplayColor = foo;
	    }
	    else if(ac.equals("cancel"))
		jframe.dispose();
	    else if(ac.equals("use")){
		jetris.setKeys(keys);
		jetris.setBaseDropTime(baseDropTimeChecker.getValue());
		jetris.setXBase(xBaseChecker.getValue());
		jetris.setAccelby(accelby);
		jetris.setGrid(grid);
		jetris.setVisibleGrid(visibleGrid);
		jetris.setForgiving(forgiving);
		jetris.setJumpingTetrominoes(jumpingTetrominoes);
		jetris.setNextPieceDisplayColor(nextPieceDisplayColor);
		jframe.dispose();
	    }
	    else if(ac.equals("save")){
		jetris.setKeys(keys);
		jetris.setBaseDropTime(baseDropTimeChecker.getValue());
		jetris.setXBase(xBaseChecker.getValue());
		jetris.setAccelby(accelby);
		jetris.setGrid(grid);
		jetris.setVisibleGrid(visibleGrid);
		jetris.setForgiving(forgiving);
		jetris.setJumpingTetrominoes(jumpingTetrominoes);
		jetris.setNextPieceDisplayColor(nextPieceDisplayColor);
		jetris.savePrefs();
		jframe.dispose();
	    }
	}
    }
    // This conludes tha PrefSel class.

    static final int boardH = 21;
    static final int boardW = 12;
    static final int squareS = 24;
    static final int tick = 20;
    
    static final int placePoints = 5;
    static final int dropPoints = 2;
    static final int downPoints = 1;
    static final int linePoints = 50;
    static final int doublePoints = 150;
    static final int triplePoints = 300;
    static final int tetrisPoints = 500;
    
    static final int shapeI = 0;
    static final int shapeO = 1;
    static final int shapeS = 2;
    static final int shapeZ = 3;
    static final int shapeT = 4;
    static final int shapeJ = 5;
    static final int shapeL = 6;

    static final int stateEmpty = 0;
    static final int stateFalling = 1;
    static final int stateDown = 2;
    static final int stateWall = 3;

    int[] keys = {
	KeyEvent.VK_NUMPAD4, //left
	KeyEvent.VK_NUMPAD6, //right
	KeyEvent.VK_N, //counterclockwise
	KeyEvent.VK_M, //retrograde
	KeyEvent.VK_NUMPAD5, //down
	KeyEvent.VK_SPACE, //drop
    };

    static final byte shapes[][]={
	{2,0,2,1,2,2,2,3, 0,1,1,1,2,1,3,1, 1,0,1,1,1,2,1,3, 0,2,1,2,2,2,3,2},
	{1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1, 1,0,2,0,1,1,2,1},
	{1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1, 1,0,1,1,2,1,2,2, 1,0,2,0,0,1,1,1},
	{2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1, 2,0,1,1,2,1,1,2, 0,0,1,0,1,1,2,1},
	{0,1,1,1,2,1,1,2, 1,0,1,1,2,1,1,2, 1,0,0,1,1,1,2,1, 1,0,0,1,1,1,1,2},
	{1,0,1,1,1,2,2,2, 0,2,1,2,2,2,2,1, 2,3,2,2,2,1,1,1, 3,1,2,1,1,1,1,2},
	{2,0,2,1,2,2,1,2, 0,1,1,1,2,1,2,2, 1,3,1,2,1,1,2,1, 3,2,2,2,1,2,1,1}
	//	{0,1,1,1,2,1,0,2, 1,0,1,1,1,2,2,2, 2,0,0,1,1,1,2,1, 0,0,1,0,1,1,1,2},
	//	{0,0,0,1,1,1,2,1, 1,0,1,1,0,2,1,2, 0,1,1,1,2,1,2,2, 1,0,2,0,1,1,1,2}
    };

    static final Color solidcolors[]={
	Color.cyan,
	Color.gray,
	Color.green,
	Color.red,
	Color.magenta,
	Color.orange,
	Color.blue
    };

    Rectangle boardRect = new Rectangle(0, 0, boardW*squareS, boardH*squareS);
    Rectangle nextRect = new Rectangle(boardW*squareS+squareS, 0, 4*squareS, 4*squareS);
    Square[][] board = new Square[boardH][boardW];
    Square[][] next = new Square[4][4];

    int x, y, shape, rotation, nextshape, nextrot, score, lines, singles, doubles, triples, tetrises, ticks, dropTime, drops, accelby;
    long repaintTicks;
    double baseDropTime, xBase;
    float repaintT, repaintTDelta;
    boolean done, pause = true, discrete = false, grid, visibleGrid, largeScreen, coolcolors = true, outlines=false, cinderblocks=false, filledCinderblocks=false, forgiving, jumpingTetrominoes, player_has_acted_since_last_droptick;
    Color nextPieceDisplayColor;
    Timer timer;
    Random rand = new Random(System.currentTimeMillis());
    public Jetris(){
	for(int i=0; i!=boardH; i++)
	    for(int j=0; j!=boardW; j++)
		board[i][j] = new Square();
	for(int i=0; i!=boardH; i++){
	    board[i][0].setState(stateWall);
	    board[i][11].setState(stateWall);
	}
	for(int i=0; i!=boardW; i++)
	    board[20][i].setState(stateWall);
	for(int i=0; i!=4; i++)
	    for(int j=0; j!=4; j++)
		next[i][j] = new Square();
	timer = new Timer(tick, this);
	timer.setInitialDelay(0);
	dropTime = 24;
    }
    public void run(){
	repaintT = (float) ((double)(System.currentTimeMillis()%314159265) / 2000d)-repaintTDelta;
	nextet();
	timer.start();
    }
    public void paint(Graphics g)
    {
	super.paint(g);
	Graphics2D g2 = (Graphics2D) g;
	g2.setPaint(Color.black);
	g2.fill(boardRect);
	
	if(!pause)
	    repaintT = (float) ((double)(System.currentTimeMillis()%314159265) / 2000d)-repaintTDelta;
	float pif = (float) Math.PI;
	if(coolcolors){
	    //choose the colors
	    Color colors[] = new Color[3];
	    for(int i=0; i!=3; i++){
		float iota = (float) i * pif / 6;
		colors[i] = new Color((float)(Math.sin(repaintT + iota)/2+.5),(float)(Math.sin(repaintT+2*pif/3 + iota)/2+.5),(float)(Math.sin(repaintT + 4*pif/3 + iota)/2+.5));
	    }
	    Color darkerColors[] = new Color[3];
	    if(filledCinderblocks)
		for(int i=0; i!=3; i++){
		    float iota = (float) i * pif / 6;
		    darkerColors[i] = new Color((float)((Math.sin(repaintT + iota)/2+.5)/2),(float)((Math.sin(repaintT+2*pif/3 + iota)/2+.5)/2),(float)((Math.sin(repaintT + 4*pif/3 + iota)/2+.5)/2));
		}
	    //paint the board
	    for(int i=0; i!=boardH; i++)
		for(int j=0; j!=boardW; j++)
		    if(board[i][j].getState() != stateEmpty){
			g2.setPaint(colors[board[i][j].getState()-1]);
			if(outlines)
			    g2.fill(new Rectangle2D.Double(j*squareS+1, i*squareS+1, squareS-1, squareS-1));
			else
			    g2.fill(new Rectangle2D.Double(j*squareS, i*squareS, squareS, squareS));
			if(cinderblocks){
			    if(filledCinderblocks)
				g2.setPaint(darkerColors[board[i][j].getState()-1]);
			    else
				g2.setPaint(Color.black);
			    g2.fill(new Rectangle2D.Double(j*squareS+4, i*squareS+4, squareS-4, squareS-4));
			}
		    }
	} else { //gay one-shape-one-color crap
	    Color sidecolor = new Color((float)(Math.sin(repaintT)/2+.5),(float)(Math.sin(repaintT+2*pif/3)/2+.5),(float)(Math.sin(repaintT + 4*pif/3)/2+.5));
	    for(int i=0; i!=boardH-1; i++)
		for(int j=1; j!=boardW-1; j++)
		    if(board[i][j].getState()!=stateEmpty){
			g2.setPaint(solidcolors[board[i][j].getShape()]);
			g2.fill(new Rectangle2D.Double(j*squareS, i*squareS, squareS, squareS));
		    }
	}
	//Paint next
	g2.setPaint(nextPieceDisplayColor);
	for(int i=0; i!=4; i++)
	    for(int j=0; j!=4; j++)
		if(next[i][j].getState() != 0)
		    g2.fill(new Rectangle2D.Double(j*squareS+boardW*squareS+squareS, i*squareS+squareS, squareS, squareS));
	//Paint stats, state
	int margin = boardW * squareS + squareS;
	int downness = 6 * squareS;
	g2.setPaint(Color.black);
	if(done)
	    g2.drawString("Game Over", margin, 15);
	if(!done && pause)
	    g2.drawString("Paused", margin, 15);
	g2.drawString("Score: ".concat(String.valueOf(score)), margin, downness);
	g2.drawString("Lines: ".concat(String.valueOf(lines)), margin, downness+20);
	downness = 9*squareS;
	g2.drawString("Singles:  ".concat(String.valueOf(singles)), margin, downness);
	g2.drawString("Doubles:  ".concat(String.valueOf(doubles)), margin, downness+20);
	g2.drawString("Triples:  ".concat(String.valueOf(triples)), margin, downness+40);
	g2.drawString("Tetrises: ".concat(String.valueOf(tetrises)), margin, downness+60);

	//Paint keys
	g2.setPaint(Color.black);
	downness = 14*squareS + 100;
	g2.drawString("= for preferences", margin, downness);
	g2.drawString("s for new game", margin, downness + 20);
	g2.drawString("p for pause", margin, downness + 40);
	g2.drawString("q for quit", margin, downness + 60);
	//Paint level bar
	g2.setPaint(Color.black);
	g2.fill(new Rectangle2D.Double(boardW*squareS+squareS, 6*squareS+30, squareS*4d, squareS/3d));
	g2.setPaint(new Color(
			      (float)(Math.sin((double)dropTime/baseDropTime*Math.PI*2d)/2d+.5d), 
			      (float)(Math.sin((double)dropTime/baseDropTime*Math.PI*2d+2d/3d*Math.PI)/2d+.5d),
			      (float)(Math.sin((double)dropTime/baseDropTime*Math.PI*2d+4d/3d*Math.PI)/2d+.5d)
			      ));
	g2.fill(new Rectangle2D.Double(boardW*squareS+squareS, 6*squareS+30, squareS*((int)baseDropTime-dropTime)*4d/25d, squareS/3d));
	//paint grid
	if(grid){
	    if(visibleGrid)
		g2.setPaint(Color.white);
	    else
		g2.setPaint(Color.gray);
	    for(int i=2; i!=boardW-1; i++)
		for(int j=1; j!=boardH-1; j++)
		    g2.fill(new Rectangle2D.Double(i*squareS-1, j*squareS-1, 1, 1));
	}
    }
    void plotShape(int state){
	for(int i=0; i < 8;i += 2){
	    board[y+shapes[shape][rotation*8+i+1]][x+shapes[shape][rotation*8+i]].setState(state);
	    board[y+shapes[shape][rotation*8+i+1]][x+shapes[shape][rotation*8+i]].setShape(shape);
	}
    }
    void plotNext(){
	for(int i=0; i!=4; i++)
	    for(int j=0; j!=4; j++)
		next[i][j].setState(0);
	for(int i=0; i < 8;i += 2)
	    next[shapes[nextshape][nextrot*8+i+1]][shapes[nextshape][nextrot*8+i]].setState(1);
	//repaint(nextRect);
	repaint();
    }
    void remLine(int lineY){
	for(int i=lineY; i!=0; i--)
	    for(int j=1; j!=boardW-1; j++)
		board[i][j].setTo(board[i-1][j]);
	for(int j=1; j!=boardW-1; j++)
	    board[0][j].state=stateEmpty;
	if(!done)
	    lines++;
	//repaint(boardRect);
	repaint();
    }
    void nextet(){
	int linesperpiece = 0;
	for(int i=0; i < boardH - 1; i++){
	    boolean line = true;
	    for(int j = 1; j < boardW - 1; j++)
		if(board[i][j].getState() != stateDown)
		    line = false;
	    if(line){
		remLine(i);
		linesperpiece++;
	    }
	}
	switch(linesperpiece){
	case 0:
	    break;
	case 1:
	    if(!done){
		score += linePoints;
		singles += 1;
	    }
	    break;
	case 2:
	    if(!done){
		score += doublePoints;
		doubles += 1;
	    }
	    break;
	case 3:
	    if(!done){
		score += triplePoints;
		triples += 1;
	    }
	    break;
	case 4:
	    if(!done){
		score += tetrisPoints;
		tetrises += 1;
	    }
	    break;
	default:
	    break;
	}
	// accelerationalgorithm
	switch(accelby){
	case AccelbyEnum.lines:
	    dropTime = (int) (baseDropTime/(((double)lines*xBase)+1));
	    break;
	case AccelbyEnum.drops:
	    dropTime = (int) (baseDropTime/(((double)drops*xBase)+1));
	    break;
	case AccelbyEnum.score:
	    dropTime = (int) (baseDropTime/(((double)score*xBase)+1));
	    break;
	}
	x = 4;
	y = 0;
	ticks = 0;
	rotation = nextrot;
	nextrot = rand.nextInt(4);
	shape = nextshape;
	nextshape = rand.nextInt(7);
	plotNext();
	//	repaint(boardRect);
	repaint();
	if(bump()){
	    done = true;
	    pause = true;
	}
	ticks = 0;
	plotShape(stateFalling);
    }
    boolean bump(){
	for(int i = 0; i < 8; i += 2)
	    if(board[y + shapes[shape][rotation * 8 + i + 1]][x + shapes[shape][rotation * 8 + i]].getState() > stateEmpty)
		return true;
	return false;
    }
    void stick(){
	if(y > boardH - 2 || bump()){
	    y--;
	    if(!forgiving || !player_has_acted_since_last_droptick){
		plotShape(stateDown);
		//	    repaint(boardRect);
		repaint();
		nextet();
		if(!done)
		    score += placePoints;
	    }
	}
    }
    void rot(int rotdir){
	//+4 because % sucks
	rotation = (rotation + rotdir + 4)%4;
	if(bump())
	    if(!jumpingTetrominoes)
		rotation = (rotation - rotdir + 4) % 4;
	    else{
		if(y!=0)
		    y--;
		if(bump() && y!=0){
		    y--;
		    if(bump()){
			y=y+2;
			rotation = (rotation - rotdir + 4) % 4;
		    }
		}
	    }
    }
    public void setKeys(int[] newKeys){
	keys = newKeys;
    }
    public void setBaseDropTime(double newBaseDropTime){
	baseDropTime = newBaseDropTime;
    }
    public void setXBase(double newXBase){
	xBase = newXBase;
    }
    public void setAccelby(int newAccelby){
	accelby = newAccelby;
    }
    public void setGrid(boolean usingGrid){
	grid = usingGrid;
    }
    public void setVisibleGrid(boolean isVisibleGrid){
	visibleGrid = isVisibleGrid;
    }
    public void setLargeScreen(boolean isLargeScreen){
	largeScreen = isLargeScreen;
    }
    public void setForgiving(boolean isForgiving){
	forgiving = isForgiving;
    }
    public void setJumpingTetrominoes(boolean isJumpingTetrominoes){
	jumpingTetrominoes = isJumpingTetrominoes;
    }
    public void setNextPieceDisplayColor(Color newNextPieceDisplayColor){
	nextPieceDisplayColor = newNextPieceDisplayColor;
    }
    public void savePrefs(){
	//#if JAVAVER >= 14
	Preferences prefs = Preferences.userNodeForPackage(Jetris.class);
	prefs.putDouble("baseDropTime", baseDropTime);
	prefs.putDouble("xBase", xBase);
	prefs.putInt("accelby", accelby);
	prefs.putInt("leftKey", keys[KeyEnum.left]);
	prefs.putInt("rightKey", keys[KeyEnum.right]);
	prefs.putInt("ccrotKey", keys[KeyEnum.ccrot]);
	prefs.putInt("rgrotKey", keys[KeyEnum.rgrot]);
	prefs.putInt("downKey", keys[KeyEnum.down]);
	prefs.putInt("dropKey", keys[KeyEnum.drop]);
	prefs.putBoolean("grid", grid);
	prefs.putBoolean("visibleGrid", visibleGrid);
	prefs.putBoolean("largeScreen", largeScreen);
	prefs.putBoolean("forgiving", forgiving);
	prefs.putBoolean("jumpingTetrominoes", jumpingTetrominoes);
	prefs.putInt("nextPieceDisplayColorRed", nextPieceDisplayColor.getRed());
	prefs.putInt("nextPieceDisplayColorGreen", nextPieceDisplayColor.getGreen());
	prefs.putInt("nextPieceDisplayColorBlue", nextPieceDisplayColor.getBlue());
	//#endif
    }
    public void keyTyped(KeyEvent e){
    }
    public void keyReleased(KeyEvent e){
    }
    public void keyPressed(KeyEvent e){
	int rotdir;
	if(pause){
	    repaintTDelta = (float) ((double)(((double)System.currentTimeMillis()-repaintT*2000.0)%314159265) / 2000d);
	    if(!done)
		pause = false;
	}
	int kc = e.getKeyCode();
	//try switch(kc); throw new JavaIsGayException("WTF??");
	plotShape(stateEmpty);
	if(kc==KeyEvent.VK_Q){
	    System.exit(0);
	}
	else if(kc==KeyEvent.VK_EQUALS){
	    pause=true;
	    JFrame jframe = new JFrame("Preferences");
	    jframe.setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
	    PrefSel prefSel = new PrefSel(keys, baseDropTime, xBase, accelby, grid, visibleGrid, largeScreen, forgiving, jumpingTetrominoes, nextPieceDisplayColor, this, jframe);
	    prefSel.setOpaque(true);
	    jframe.setContentPane(prefSel);
	    jframe.pack();
	    //jframe.addKeyListener(prefSel);
	    jframe.setVisible(true);
	}
	else if(kc==KeyEvent.VK_S){
	    for(int i=0; i!=boardH-1; i++)
		for(int j=1; j!=boardW-1; j++){
		    board[i][j].setShape(0);
		    board[i][j].setState(stateEmpty);
		}
	    lines = 0;
	    score = 0;
	    singles = 0;
	    doubles = 0;
	    triples = 0;
	    tetrises = 0;
	    drops = 0;
	    nextet();
	    done = false;
	}
	else if(kc==keys[KeyEnum.left]){
	    player_has_acted_since_last_droptick = true;
	    x--;
	    if(bump())
		x++;
	}
	else if(kc==keys[KeyEnum.right]){
	    player_has_acted_since_last_droptick = true;
	    x++;
	    if(bump())
		x--;
	}
	else if(kc==keys[KeyEnum.ccrot]){
	    player_has_acted_since_last_droptick = true;
	    rot(1);
	}
	else if(kc==keys[KeyEnum.rgrot]){
	    player_has_acted_since_last_droptick = true;
	    rot(-1);
	}
	else if(kc==keys[KeyEnum.down]){
	    player_has_acted_since_last_droptick = true;
	    y++;
	    if(!done)
		score += downPoints;
	    if(bump()){
		if(!done)
		    score -= downPoints;
		y--;
		stick();
	    }
	}
	else if(kc==keys[KeyEnum.drop]){
	    player_has_acted_since_last_droptick = false;
	    while(!bump()){
		y++;
		if(!done)
		    score += dropPoints;
		if(!done)
		    drops++;
	    }
	    stick();
	}   
	else
	    pause=true;

	plotShape(stateFalling);
	//	repaint(boardRect);
	repaint();
    }
    public void actionPerformed(ActionEvent e){
	repaintTicks++;
	if(!pause && !done)
	    ticks++;
	if(ticks >= dropTime){
	    ticks = 0;
	    plotShape(stateEmpty);
	    y++;
	    stick();
	    plotShape(stateFalling);
	    player_has_acted_since_last_droptick = false;
	}
	if(repaintTicks%3==0)
	    //	    repaint(boardRect);
	    repaint();
    }
    public void init(){
	run();
    }
    public static void main(String[] args){
	double baseDropTime, xBase;
	int accelby;
	int[] keys = {0,0,0,0,0,0};
	boolean grid, visibleGrid, largeScreen, forgiving, jumpingTetrominoes;
	Color nextPieceDisplayColor;
	Preferences prefs = Preferences.userNodeForPackage(Jetris.class);
	baseDropTime = prefs.getDouble("baseDropTime", 24d);
	xBase = prefs.getDouble("xBase", .01d);
	accelby = prefs.getInt("accelby", AccelbyEnum.drops);
	keys[KeyEnum.left] = prefs.getInt("leftKey", KeyEvent.VK_NUMPAD4);
	keys[KeyEnum.right] = prefs.getInt("rightKey", KeyEvent.VK_NUMPAD6);
	keys[KeyEnum.ccrot] = prefs.getInt("ccrotKey", KeyEvent.VK_N);
	keys[KeyEnum.rgrot] = prefs.getInt("rgrotKey", KeyEvent.VK_M);
	keys[KeyEnum.down] = prefs.getInt("downKey", KeyEvent.VK_NUMPAD5);
	keys[KeyEnum.drop] = prefs.getInt("dropKey", KeyEvent.VK_SPACE);
	grid = prefs.getBoolean("grid", true);
	visibleGrid=prefs.getBoolean("visibleGrid", false);
	largeScreen=prefs.getBoolean("largeScreen", false);
	forgiving=prefs.getBoolean("forgiving", false);
	jumpingTetrominoes=prefs.getBoolean("jumpingTetrominoes", false);
	nextPieceDisplayColor = 
	    new Color(prefs.getInt("nextPieceDisplayColorRed",0xff),
		      prefs.getInt("nextPieceDisplayColorGreen",0xff),
		      prefs.getInt("nextPieceDisplayColorBlue",0xff));
	
	//#endif
	boolean badCommandLine = false;
	if(args.length != 0)
	    for(int i=0; i!=args.length && !badCommandLine; i++){
		if(args[i].equals("-t")){
		    i++;
		    if(i>args.length)
			badCommandLine = true;
		    else{
			try{
			    baseDropTime = Double.parseDouble(args[i]);
			}catch(NumberFormatException e){
			    badCommandLine = true;
			}
			if(!badCommandLine)
			    if((int)baseDropTime < 1){
				System.out.println("The pieces can't drop in 0 or less milliseconds.  It would make no sense for them to.");
				System.exit(2);
			    }
		    }
		}
		else if(args[i].equals("-b")){
		    i++;
		    if(i>args.length)
			badCommandLine = true;
		    else{
			try{
			    xBase = Double.parseDouble(args[i]);
			}catch(NumberFormatException e){
			    badCommandLine = true;
			}
		    }
		}
		else
		    badCommandLine = true;
	    }
	if(badCommandLine){
	    System.out.println("Usage:");
	    System.out.println("-t baseDropTime to set the initial drop time.  This is multiplied by 20ms.  Will be squished to the nearest integer in practice, but you can set it to a floating point if you want to.  Must be greater than a number that rounds to 0, for obvious reasons..");
	    System.out.println("-x acceleration to set the acceleration factor.  0 is no acceleration, positive values increase acceleration, I don't know what negative numbers do.");
	}
	JFrame frame = new JFrame("Jetris");
	frame.setSize((boardW+6)*squareS, (boardH+1)*squareS);
	Jetris jetris = new Jetris();
	frame.getContentPane().add("Center", jetris);
	frame.addWindowListener(new WindowAdapter() {
		public void windowClosing(WindowEvent e) {System.exit(0);}
	    });
	frame.addKeyListener(jetris);
	frame.setVisible(true);
	jetris.setBaseDropTime(baseDropTime);
	jetris.setXBase(xBase);
	jetris.setAccelby(accelby);
	jetris.setKeys(keys);
	jetris.setGrid(grid);
	jetris.setVisibleGrid(visibleGrid);
	jetris.setLargeScreen(largeScreen);
	jetris.setForgiving(forgiving);
	jetris.setJumpingTetrominoes(jumpingTetrominoes);
	jetris.setNextPieceDisplayColor(nextPieceDisplayColor);
	jetris.run();
    }
}
