import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
public class DummyHash {
    public static void main(String[] args) {
        System.out.println(new BCryptPasswordEncoder().encode("dummy"));
    }
}
