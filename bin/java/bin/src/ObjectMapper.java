import java.io.IOException;
import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.*;
import java.applet.Applet;
/**
 * Write a description of class ObjectMapper here.
 * 
 * @author (your name) 
 * @version (a version number or a date)
 */
public class ObjectMapper extends Applet
{   
    private BufferedImage img;
    
    public void init() {
        try {
            img = ImageIO.read(new File("../objectMap.png"));
        } catch (IOException e){
        }
    }
    
    public void paint(Graphics g) {
        g.drawString("hi",40,20);
        g.drawImage(img,0,0,null);
    }
}